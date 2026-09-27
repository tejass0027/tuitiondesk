import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarCheck, FileText, IndianRupee, MessageCircle, NotebookPen, Pencil, Phone, ReceiptIndianRupee } from "lucide-react";
import { getCentre } from "@/lib/auth";
import { formatDate, formatINR, formatMonth, todayIST } from "@/lib/format";
import { isISOMonth, monthEnd } from "@/lib/calendar";
import { AttendanceCalendar } from "@/components/attendance/attendance-calendar";
import { formatPhone } from "@/lib/phone";
import { PageHeader } from "@/components/layout/page-header";
import { InitialsAvatar } from "@/components/shared/initials-avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { classLabel } from "@/lib/classes";
import { paymentModeLabel } from "@/lib/fees";
import { PaymentSheet } from "@/app/(app)/fees/payment-sheet";
import { RemovePaymentButton } from "./remove-payment-button";
import { ReminderSheet } from "@/components/reminders/reminder-sheet";
import { customMessageStart } from "@/lib/whatsapp";
import { formatMarks, percentOf, scoreBand } from "@/lib/marks";

const BAND_STYLE = {
  good: "bg-success-soft text-success",
  average: "bg-warning-soft text-warning",
  low: "bg-danger-soft text-danger",
};

export const metadata: Metadata = { title: "Student" };

export default async function StudentProfilePage({ params, searchParams }: PageProps<"/students/[id]">) {
  const { id } = await params;
  const { month: monthParam } = await searchParams;
  const today = todayIST();
  const month = isISOMonth(monthParam) && monthParam <= today.slice(0, 7) ? monthParam : today.slice(0, 7);
  const { supabase, centre } = await getCentre();
  await supabase.rpc("generate_monthly_fees"); // make sure this month's fee exists

  const [{ data: student }, { data: stats }, { data: fees }, { data: monthMarks }, { data: testMarks }] = await Promise.all([
    supabase.from("students").select("*, batches(name)").eq("id", id).maybeSingle(),
    supabase.from("student_attendance_stats").select("*").eq("student_id", id).maybeSingle(),
    supabase.from("fee_overview").select("*").eq("student_id", id).order("month", { ascending: false }),
    supabase
      .from("attendance")
      .select("date, status")
      .eq("student_id", id)
      .gte("date", `${month}-01`)
      .lte("date", monthEnd(month)),
    supabase
      .from("test_marks")
      .select("marks, absent, tests(id, name, subject, test_date, max_marks)")
      .eq("student_id", id),
  ]);

  // Newest test first; average % over the tests the student actually wrote
  const results = (testMarks ?? [])
    .filter((r) => r.tests)
    .sort((a, b) => (b.tests!.test_date > a.tests!.test_date ? 1 : -1));
  const written = results.filter((r) => !r.absent && r.marks !== null);
  const averagePct = written.length
    ? Math.round(
        written.reduce((sum, r) => sum + percentOf(Number(r.marks), Number(r.tests!.max_marks)), 0) / written.length,
      )
    : null;

  if (!student) notFound();

  const { data: payments } = fees?.length
    ? await supabase
        .from("payments")
        .select("id, fee_record_id, amount, paid_on, mode, note")
        .in("fee_record_id", fees.map((f) => f.id))
        .order("paid_on")
    : { data: [] };

  const attendancePct =
    stats && stats.total_days > 0 ? Math.round((stats.present_days / stats.total_days) * 100) : null;
  const pending = (fees ?? []).reduce((sum, f) => sum + Number(f.balance), 0);
  const hasOverdue = (fees ?? []).some((f) => f.status === "overdue");

  return (
    <>
      <PageHeader
        title={student.name}
        backHref="/students"
        action={
          <Button asChild variant="outline" size="icon" aria-label="Edit student">
            <Link href={`/students/${student.id}/edit`}>
              <Pencil aria-hidden />
            </Link>
          </Button>
        }
      />

      {/* Who they are */}
      <section className="flex items-center gap-4 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/8">
        <InitialsAvatar name={student.name} className="size-16 text-xl" />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold">
            {[student.class && classLabel(student.class), student.batches?.name].filter(Boolean).join(" · ")}
          </p>
          <p className="text-[0.95rem] text-muted-foreground">
            Joined {formatDate(student.joining_date)} · {formatINR(student.monthly_fee)}/month
          </p>
          {!student.is_active && (
            <Badge variant="secondary" className="mt-2">
              Left the centre
            </Badge>
          )}
        </div>
      </section>

      {/* Parents */}
      <section className="mt-4 grid gap-3 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/8">
        <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Parents</p>
        {(
          [
            { who: "father", title: "Father", name: student.father_name, phone: student.father_phone },
            { who: "mother", title: "Mother", name: student.mother_name, phone: student.mother_phone },
          ] as const
        ).map((p) => {
          const getsMessages = student.contact_parent === p.who;
          return (
            <div key={p.who} className="rounded-xl bg-muted/50 p-3">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="text-sm font-semibold text-muted-foreground">{p.title}</p>
                {getsMessages && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">
                    <MessageCircle className="size-3" aria-hidden /> Gets messages
                  </span>
                )}
              </div>
              <p className="text-lg font-semibold">{p.name || "Name not added"}</p>
              <p className="text-base text-muted-foreground">{p.phone ? formatPhone(p.phone) : "No phone number"}</p>
              {p.phone && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button asChild variant="outline">
                    <a href={`tel:+${p.phone}`}>
                      <Phone aria-hidden /> Call
                    </a>
                  </Button>
                  <ReminderSheet
                    title={`Message ${p.title.toLowerCase()}`}
                    type="custom"
                    triggerLabel="WhatsApp"
                    triggerVariant="default"
                    triggerSize="default"
                    triggerClassName="bg-[#1f9d55] text-white hover:bg-[#1a8a4a]"
                    recipient={{
                      studentId: student.id,
                      studentName: student.name,
                      parentName: p.name,
                      phone: p.phone,
                    }}
                    initialMessage={customMessageStart({ parentName: p.name, centreName: centre.name })}
                  />
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* Two quick numbers */}
      <section className="mt-4 grid grid-cols-2 gap-3">
        <StatCard
          icon={CalendarCheck}
          label="Attendance"
          value={attendancePct === null ? "—" : `${attendancePct}%`}
          note={
            attendancePct === null
              ? "Not marked yet"
              : `${stats!.present_days} of ${stats!.total_days} ${stats!.total_days === 1 ? "day" : "days"}`
          }
          tone={attendancePct !== null && attendancePct < 75 ? "danger" : "default"}
        />
        <StatCard
          icon={IndianRupee}
          label="Fees pending"
          value={formatINR(pending)}
          note={pending === 0 ? "All clear" : hasOverdue ? "Includes overdue" : "Not yet overdue"}
          tone={hasOverdue ? "danger" : pending > 0 ? "warning" : "success"}
        />
      </section>

      <Button asChild variant="outline" size="lg" className="mt-4 w-full">
        <Link href={`/students/${student.id}/report`}>
          <FileText aria-hidden /> Report card (PDF)
        </Link>
      </Button>

      {/* Attendance calendar */}
      <section className="mt-8">
        <h2 className="mb-3 text-xl font-bold">Attendance</h2>
        <AttendanceCalendar
          month={month}
          today={today}
          marks={Object.fromEntries((monthMarks ?? []).map((m) => [m.date, m.status]))}
          hrefForMonth={(m) => `/students/${id}?month=${m}`}
        />
      </section>

      {/* Test marks */}
      <section className="mt-8">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-xl font-bold">Marks</h2>
          {averagePct !== null && (
            <p className="text-sm text-muted-foreground">
              Average <strong className="text-foreground">{averagePct}%</strong> in {written.length}{" "}
              {written.length === 1 ? "test" : "tests"}
            </p>
          )}
        </div>
        {results.length === 0 ? (
          <div className="flex items-center gap-3 rounded-2xl border-2 border-dashed p-5 text-muted-foreground">
            <NotebookPen className="size-6 shrink-0" aria-hidden />
            <p className="text-base">
              No marks yet.{" "}
              <Link href="/tests" className="font-semibold text-primary hover:underline">
                Enter test marks
              </Link>
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-2">
            {results.map((r) => {
              const t = r.tests!;
              const pct = r.absent || r.marks === null ? null : percentOf(Number(r.marks), Number(t.max_marks));
              return (
                <li key={t.id}>
                  <Link
                    href={`/tests/${t.id}`}
                    className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/8 transition-colors hover:bg-muted/60"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-semibold">
                        {t.name}
                        {t.subject && <span className="font-normal text-muted-foreground"> · {t.subject}</span>}
                      </span>
                      <span className="block text-sm text-muted-foreground">{formatDate(t.test_date)}</span>
                    </span>
                    <span className="text-right">
                      <span className="block text-base font-bold">
                        {pct === null ? "Absent" : `${formatMarks(r.marks)}/${formatMarks(t.max_marks)}`}
                      </span>
                      {pct !== null && (
                        <span className={cn("mt-0.5 inline-block rounded-full px-2 text-sm font-bold", BAND_STYLE[scoreBand(pct)])}>
                          {pct}%
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Fee history */}
      <section className="mt-8">
        <h2 className="mb-3 text-xl font-bold">Fee history</h2>
        {!fees?.length ? (
          <div className="flex items-center gap-3 rounded-2xl border-2 border-dashed p-5 text-muted-foreground">
            <ReceiptIndianRupee className="size-6 shrink-0" aria-hidden />
            <p className="text-base">No fees yet. Fees are added automatically each month while the student is active.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-2.5">
            {fees.map((f) => {
              const partial = f.status !== "paid" && Number(f.amount_paid) > 0;
              const feePayments = (payments ?? []).filter((p) => p.fee_record_id === f.id);
              return (
                <li key={f.id} className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/8">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold">{formatMonth(f.month)}</p>
                      <p className="text-sm text-muted-foreground">
                        {f.status === "paid"
                          ? `Paid ${formatINR(f.amount_paid)}`
                          : partial
                            ? `Paid ${formatINR(f.amount_paid)} of ${formatINR(f.amount_due)}`
                            : `Due by ${formatDate(f.due_date)}`}
                      </p>
                    </div>
                    <div className="grid justify-items-end gap-1">
                      <p className="text-base font-bold">
                        {formatINR(f.status === "paid" ? f.amount_due : f.balance)}
                      </p>
                      <StatusBadge status={f.status} label={partial && f.status === "due" ? "Part paid" : undefined} />
                    </div>
                  </div>

                  {feePayments.length > 0 && (
                    <ul className="mt-3 grid gap-1 border-t pt-2">
                      {feePayments.map((p) => (
                        <li key={p.id} className="flex items-center gap-2 text-sm">
                          <span className="flex-1 text-muted-foreground">
                            {formatDate(p.paid_on)} · {paymentModeLabel(p.mode)}
                            {p.note && ` · ${p.note}`}
                          </span>
                          <span className="font-semibold">{formatINR(p.amount)}</span>
                          <RemovePaymentButton
                            paymentId={p.id}
                            description={`${formatINR(p.amount)} by ${paymentModeLabel(p.mode)} on ${formatDate(p.paid_on)}`}
                          />
                        </li>
                      ))}
                    </ul>
                  )}

                  {f.status !== "paid" && (
                    <PaymentSheet fee={f} triggerClassName="mt-3 w-full" />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}

function StatCard({
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
  tone: "default" | "success" | "warning" | "danger";
}) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/8">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
        <Icon className="size-4" aria-hidden /> {label}
      </p>
      <p
        className={cn(
          "mt-1 text-2xl font-bold",
          tone === "danger" && "text-danger",
          tone === "warning" && "text-warning",
          tone === "success" && "text-success",
        )}
      >
        {value}
      </p>
      <p className="text-sm text-muted-foreground">{note}</p>
    </div>
  );
}
