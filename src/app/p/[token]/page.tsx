import { cache } from "react";
import type { Metadata } from "next";
import { CalendarCheck, IndianRupee, Link2Off, NotebookPen, Phone, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { addMonths, isISOMonth } from "@/lib/calendar";
import { classLabel } from "@/lib/classes";
import { formatDate, formatINR, formatMonth } from "@/lib/format";
import { formatMarks, percentOf, scoreBand } from "@/lib/marks";
import { formatPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { AttendanceCalendar } from "@/components/attendance/attendance-calendar";
import { StatusBadge } from "@/components/shared/status-badge";
import type { AttendanceStatus, FeeStatus } from "@/types/database";

/** What public.parent_view(token) returns (see the migration). */
type ParentView = {
  today: string;
  centre: { name: string; phone: string };
  student: { name: string; class: string; batch: string | null; joining_date: string; is_active: boolean };
  totals: { total: number; present: number };
  attendance: { date: string; status: AttendanceStatus }[];
  holidays: { date: string; name: string }[];
  tests: { name: string; subject: string; date: string; max: number; marks: number | null; absent: boolean }[];
  fees: { month: string; due: number; paid: number; balance: number; status: FeeStatus }[];
};

const BAND_STYLE = {
  good: "bg-success-soft text-success",
  average: "bg-warning-soft text-warning",
  low: "bg-danger-soft text-danger",
};

// One database call per request, shared by the page and its <title>
const loadView = cache(async (token: string) => {
  if (!/^[\w-]{24,64}$/.test(token)) return null;
  const supabase = await createClient();
  const { data } = await supabase.rpc("parent_view", { p_token: token });
  return (data as ParentView | null) ?? null;
});

export async function generateMetadata({ params }: PageProps<"/p/[token]">): Promise<Metadata> {
  const view = await loadView((await params).token);
  return {
    title: view ? `${view.student.name} · ${view.centre.name}` : "Link not active",
    robots: { index: false, follow: false }, // private pages, never in Google
  };
}

/**
 * The read-only page parents open from WhatsApp. No login: the long secret
 * token in the URL is the key, and the owner can turn it off any time.
 */
export default async function ParentPage({ params, searchParams }: PageProps<"/p/[token]">) {
  const { token } = await params;
  const { month: monthParam } = await searchParams;
  const view = await loadView(token);

  if (!view) {
    return (
      <main className="mx-auto grid min-h-dvh max-w-md place-content-center gap-3 px-6 text-center">
        <Link2Off className="mx-auto size-14 text-muted-foreground" aria-hidden />
        <h1 className="text-2xl font-bold">This link is not active</h1>
        <p className="text-lg text-muted-foreground">
          It may have been turned off. Please ask the tuition centre to send you a new link.
        </p>
      </main>
    );
  }

  const { today, centre, student, totals } = view;
  const thisMonth = today.slice(0, 7);
  const oldest = addMonths(thisMonth, -3); // the page only has the last ~4 months of attendance
  const month = isISOMonth(monthParam) && monthParam <= thisMonth && monthParam >= oldest ? monthParam : thisMonth;

  const attendancePct = totals.total > 0 ? Math.round((totals.present / totals.total) * 100) : null;
  const written = view.tests.filter((t) => !t.absent && t.marks !== null);
  const averagePct = written.length
    ? Math.round(written.reduce((sum, t) => sum + percentOf(Number(t.marks), Number(t.max)), 0) / written.length)
    : null;
  const feesDue = view.fees.reduce((sum, f) => sum + Math.max(Number(f.balance), 0), 0);
  const hasOverdue = view.fees.some((f) => f.status === "overdue");
  const upcomingHoliday = view.holidays.find((h) => h.date >= today);

  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <header className="relative isolate overflow-hidden bg-[#1e1b4b] px-5 pt-8 pb-16 text-white">
        <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-br from-indigo-800 via-indigo-600 to-violet-600" />
        <div aria-hidden className="absolute -top-24 -right-20 -z-10 size-72 rounded-full bg-fuchsia-400/30 blur-3xl" />
        <div className="mx-auto max-w-2xl">
          <p className="text-sm font-semibold tracking-wide text-indigo-100/90 uppercase">{centre.name}</p>
          <h1 className="mt-1 text-[2rem] leading-tight font-extrabold tracking-tight">{student.name}</h1>
          <p className="mt-1 text-base text-indigo-100/90">
            {[student.class && classLabel(student.class), student.batch].filter(Boolean).join(" · ")}
          </p>
        </div>
      </header>

      <main className="relative mx-auto -mt-10 grid max-w-2xl grid-cols-1 gap-6 px-4 pb-12">
        {/* Three big numbers */}
        <section className="grid grid-cols-3 gap-2.5">
          <Tile
            icon={CalendarCheck}
            label="Attendance"
            value={attendancePct === null ? "–" : `${attendancePct}%`}
            note={totals.total ? `${totals.present}/${totals.total} days` : "Not marked yet"}
            tone={attendancePct === null ? "muted" : attendancePct >= 75 ? "success" : "danger"}
          />
          <Tile
            icon={NotebookPen}
            label="Marks"
            value={averagePct === null ? "–" : `${averagePct}%`}
            note={written.length ? `Avg of ${written.length} ${written.length === 1 ? "test" : "tests"}` : "No tests yet"}
            tone={averagePct === null ? "muted" : BAND_TONE[scoreBand(averagePct)]}
          />
          <Tile
            icon={IndianRupee}
            label="Fees due"
            value={feesDue === 0 ? "Nil" : formatINR(feesDue)}
            note={feesDue === 0 ? "All paid" : hasOverdue ? "Overdue" : "Not yet due"}
            tone={feesDue === 0 ? "success" : hasOverdue ? "danger" : "warning"}
          />
        </section>

        {upcomingHoliday && (
          <p className="rounded-2xl bg-warning-soft px-4 py-3 text-base font-medium text-warning">
            🎉 {upcomingHoliday.name || "Holiday"}: centre closed on {formatDate(upcomingHoliday.date)}
          </p>
        )}

        {/* Attendance */}
        <section>
          <h2 className="mb-3 text-xl font-bold">Attendance</h2>
          <AttendanceCalendar
            month={month}
            today={today}
            marks={Object.fromEntries(view.attendance.map((a) => [a.date, a.status]))}
            holidays={Object.fromEntries(view.holidays.map((h) => [h.date, h.name]))}
            hrefForMonth={(m) => (m >= oldest ? `/p/${token}?month=${m}` : `/p/${token}?month=${oldest}`)}
          />
        </section>

        {/* Marks */}
        <section>
          <h2 className="mb-3 text-xl font-bold">Test marks</h2>
          {view.tests.length === 0 ? (
            <p className="rounded-2xl border-2 border-dashed p-5 text-base text-muted-foreground">No test marks yet.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-2">
              {view.tests.map((t, i) => {
                const pct = t.absent || t.marks === null ? null : percentOf(Number(t.marks), Number(t.max));
                return (
                  <li
                    key={`${t.date}-${t.name}-${i}`}
                    className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/8"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-semibold">
                        {t.name}
                        {t.subject && <span className="font-normal text-muted-foreground"> · {t.subject}</span>}
                      </span>
                      <span className="block text-sm text-muted-foreground">{formatDate(t.date)}</span>
                    </span>
                    <span className="text-right">
                      <span className="block text-base font-bold">
                        {pct === null ? "Absent" : `${formatMarks(t.marks)}/${formatMarks(t.max)}`}
                      </span>
                      {pct !== null && (
                        <span className={cn("mt-0.5 inline-block rounded-full px-2 text-sm font-bold", BAND_STYLE[scoreBand(pct)])}>
                          {pct}%
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Fees */}
        <section>
          <h2 className="mb-3 text-xl font-bold">Fees</h2>
          {view.fees.length === 0 ? (
            <p className="rounded-2xl border-2 border-dashed p-5 text-base text-muted-foreground">No fees yet.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-2">
              {view.fees.map((f) => {
                const partial = f.status !== "paid" && Number(f.paid) > 0;
                return (
                  <li key={f.month} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/8">
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold">{formatMonth(f.month)}</p>
                      <p className="text-sm text-muted-foreground">
                        {f.status === "paid"
                          ? `Paid ${formatINR(f.paid)}`
                          : partial
                            ? `Paid ${formatINR(f.paid)} of ${formatINR(f.due)}`
                            : `Fee ${formatINR(f.due)}`}
                      </p>
                    </div>
                    <div className="grid justify-items-end gap-1">
                      {f.status !== "paid" && <p className="text-base font-bold">{formatINR(f.balance)}</p>}
                      <StatusBadge status={f.status} label={partial && f.status === "due" ? "Part paid" : undefined} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {centre.phone && (
          <a
            href={`tel:+${centre.phone}`}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary text-lg font-semibold text-primary-foreground shadow-md"
          >
            <Phone className="size-5" aria-hidden /> Call {centre.name} · {formatPhone(centre.phone)}
          </a>
        )}

        <p className="flex items-center justify-center gap-2 text-center text-sm text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0" aria-hidden />
          Private page for {student.name}&apos;s family. Please don&apos;t share it. Made with TuitionDesk.
        </p>
      </main>
    </div>
  );
}

const BAND_TONE = { good: "success", average: "warning", low: "danger" } as const;

function Tile({
  icon: Icon,
  label,
  value,
  note,
  tone,
}: {
  icon: typeof CalendarCheck;
  label: string;
  value: string;
  note: string;
  tone: "success" | "warning" | "danger" | "muted";
}) {
  const color = {
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
    muted: "text-muted-foreground",
  }[tone];
  return (
    <div className="grid gap-1 rounded-2xl bg-card p-3.5 shadow-lg shadow-indigo-950/10 ring-1 ring-foreground/8">
      <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        <Icon className="size-3.5" aria-hidden /> {label}
      </p>
      <p className={cn("text-2xl leading-tight font-extrabold", color)}>{value}</p>
      <p className="text-xs text-muted-foreground">{note}</p>
    </div>
  );
}
