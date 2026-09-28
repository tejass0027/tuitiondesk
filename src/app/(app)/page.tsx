import Link from "next/link";
import {
  BellRing,
  CalendarCheck,
  CalendarClock,
  Check,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Layers,
  PartyPopper,
  NotebookPen,
  ReceiptIndianRupee,
  TrendingDown,
  UserPlus,
} from "lucide-react";
import { getCentre } from "@/lib/auth";
import { InstallApp } from "@/components/shared/install-app";
import { WEEK_DAYS, dayKeyOf, formatTimeRange } from "@/lib/batches";
import { formatDate, formatINR, formatMonth, todayIST } from "@/lib/format";
import { summarizeTotals } from "@/lib/fees";
import { feeSeries, formatINRShort, lastMonths } from "@/lib/dashboard";
import { toOverdueGroup } from "@/lib/reminders";
import { feeReminderMessage } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { FeesChart } from "@/components/dashboard/fees-chart";
import { InitialsAvatar } from "@/components/shared/initials-avatar";
import { ReminderSheet } from "@/components/reminders/reminder-sheet";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const { supabase, centre } = await getCentre();
  const today = todayIST();
  const dayKey = dayKeyOf(today);
  const months = lastMonths(today.slice(0, 7), 6);

  await supabase.rpc("generate_monthly_fees");

  // Everything is counted inside the database, so the numbers stay right at 1000+ students
  const [
    { data: batches },
    { count: activeCount },
    { data: dayCounts },
    { data: feeTotals },
    { data: topOverdue },
    { data: overdueTotals },
    { data: low },
    { data: holiday },
  ] = await Promise.all([
    supabase.from("batches").select("id, name, days, start_time, end_time").eq("is_active", true).order("start_time", { nullsFirst: false }),
    supabase.from("students").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.rpc("batch_day_counts", { p_date: today }),
    supabase.rpc("fee_month_totals", { p_from: `${months[0]}-01`, p_to: `${months[months.length - 1]}-01` }),
    // the 5 students who owe the most
    supabase.rpc("overdue_students").order("total", { ascending: false }).order("student_name").limit(5),
    supabase.rpc("overdue_totals", { p_month: today }),
    supabase.rpc("low_attendance", { p_threshold: 75 }).limit(8),
    supabase.from("holidays").select("name").eq("date", today).maybeSingle(),
  ]);

  const hasBatches = Boolean(batches?.length);
  const hasStudents = Boolean(activeCount);

  // Today's batches + whether attendance is done
  const countsFor = new Map((dayCounts ?? []).map((c) => [c.batch_id, c]));
  const todaysBatches = (batches ?? [])
    .filter((b) => !holiday && b.days.includes(dayKey))
    .map((b) => {
      const { size = 0, marked = 0 } = countsFor.get(b.id) ?? {};
      return { ...b, size, marked, done: size > 0 && marked >= size };
    });

  // Fees
  const thisMonth = summarizeTotals((feeTotals ?? []).find((t) => t.month.startsWith(today.slice(0, 7))));
  const series = feeSeries(feeTotals ?? [], months);
  const overdue = (topOverdue ?? []).map(toOverdueGroup);
  const overdueCount = overdueTotals?.[0]?.students ?? 0;
  const overdueTotal = Number(overdueTotals?.[0]?.amount ?? 0);

  const weekday = WEEK_DAYS.find((d) => d.key === dayKey)!.label;

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Welcome card */}
      <header className="relative isolate overflow-hidden rounded-3xl bg-[#1e1b4b] p-5 text-white shadow-xl shadow-indigo-900/20 sm:p-6">
        <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-br from-indigo-700 via-indigo-600 to-violet-600" />
        <div aria-hidden className="absolute -top-20 -right-16 -z-10 size-64 rounded-full bg-fuchsia-400/30 blur-3xl" />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-[0.1] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:32px_32px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
        />
        <p className="text-sm font-semibold text-indigo-100/90">
          {weekday}, {formatDate(today)}
        </p>
        <h1 className="mt-1 text-[1.9rem] leading-tight font-extrabold tracking-tight">Namaste 🙏</h1>
        <p className="text-base text-indigo-100/90">{centre.name}</p>

        {hasBatches && hasStudents && (
          <dl className="mt-5 grid grid-cols-3 gap-2">
            <HeroStat
              label="Classes today"
              value={`${todaysBatches.filter((b) => b.done).length}/${todaysBatches.length}`}
              note="marked"
            />
            <HeroStat label="Collected" value={formatINRShort(thisMonth.collected)} note={`${thisMonth.percent}% paid`} />
            <HeroStat label="Overdue" value={String(overdueCount)} note={overdueCount === 1 ? "student" : "students"} />
          </dl>
        )}
      </header>

      <InstallApp />

      {hasBatches && hasStudents && (
        <nav aria-label="Quick actions" className="grid grid-cols-4 gap-2">
          <QuickAction href="/attendance" icon={CalendarCheck} label="Attendance" tone="from-emerald-500 to-teal-600" />
          <QuickAction href="/students/new" icon={UserPlus} label="Add student" tone="from-sky-500 to-indigo-600" />
          <QuickAction href="/fees" icon={ReceiptIndianRupee} label="Fees" tone="from-amber-500 to-orange-600" />
          <QuickAction href="/tests/new" icon={NotebookPen} label="New test" tone="from-fuchsia-500 to-violet-600" />
        </nav>
      )}

      {!hasBatches || !hasStudents ? (
        <GettingStarted hasBatches={hasBatches} />
      ) : (
        <>
          {/* 1. Today's batches */}
          <Card title="Today's batches" icon={CalendarCheck} href="/attendance" linkLabel="Attendance">
            {holiday ? (
              <p className="flex items-center gap-2 rounded-xl bg-warning-soft p-3 text-base font-medium text-warning">
                <PartyPopper className="size-5 shrink-0" aria-hidden /> {holiday.name || "Holiday"} today. The centre is closed, enjoy the break!
              </p>
            ) : todaysBatches.length === 0 ? (
              <p className="flex items-center gap-2 text-base text-muted-foreground">
                <CalendarClock className="size-5" aria-hidden /> No batches meet on {weekday}. Enjoy the day!
              </p>
            ) : (
              <ul className="grid grid-cols-1 gap-2">
                {todaysBatches.map((b) => (
                  <li key={b.id}>
                    <Link
                      href={`/attendance?batch=${b.id}&date=${today}`}
                      className="flex items-center gap-3 rounded-xl p-3 ring-1 ring-foreground/8 transition-colors hover:bg-muted/60"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-base leading-snug font-semibold">{b.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {[formatTimeRange(b.start_time, b.end_time), `${b.size} ${b.size === 1 ? "student" : "students"}`].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      {b.done ? (
                        <span className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-success-soft px-3 text-sm font-semibold text-success">
                          <Check className="size-4" aria-hidden /> Marked
                        </span>
                      ) : (
                        <span className="inline-flex h-10 shrink-0 items-center gap-1 rounded-xl bg-primary px-4 text-base font-semibold text-primary-foreground">
                          Mark <ChevronRight className="size-4" aria-hidden />
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* 2. Fees this month */}
          <Card title={`Fees · ${formatMonth(`${today.slice(0, 7)}-01`)}`} icon={ReceiptIndianRupee} href="/fees" linkLabel="Fees">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                  <CircleCheck className="size-4 text-success" aria-hidden /> Collected
                </p>
                <p className="text-[1.6rem] leading-tight font-bold">{formatINR(thisMonth.collected)}</p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                  <ReceiptIndianRupee className="size-4 text-warning" aria-hidden /> Pending
                </p>
                <p className="text-[1.6rem] leading-tight font-bold">{formatINR(thisMonth.pending)}</p>
              </div>
            </div>
            <div
              className="mt-3 h-3 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={thisMonth.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Share of this month's fees collected"
            >
              <div className="h-full rounded-full bg-success" style={{ width: `${thisMonth.percent}%` }} />
            </div>
            <p className="mt-1.5 mb-4 text-sm text-muted-foreground">
              {thisMonth.percent}% of {formatINR(thisMonth.expected)} collected
            </p>
            <FeesChart data={series} />
          </Card>

          {/* 3. Overdue */}
          <Card
            title="Overdue fees"
            icon={CircleAlert}
            href="/fees?tab=overdue"
            linkLabel="See all"
            subtitle={overdueCount ? `${overdueCount} ${overdueCount === 1 ? "student" : "students"} · ${formatINR(overdueTotal)}` : undefined}
          >
            {overdueCount === 0 ? (
              <p className="flex items-center gap-2 text-base text-muted-foreground">
                <PartyPopper className="size-5" aria-hidden /> Nobody is overdue. Great job!
              </p>
            ) : (
              <>
                <ul className="grid grid-cols-1 gap-2">
                  {overdue.slice(0, 5).map((o) => (
                    <li key={o.studentId} className="flex items-center gap-3">
                      <InitialsAvatar name={o.studentName} className="size-10 text-sm" />
                      <Link href={`/students/${o.studentId}`} className="min-w-0 flex-1 hover:underline">
                        <span className="block text-base leading-snug font-semibold">{o.studentName}</span>
                        <span className="block text-sm font-medium text-danger">
                          {formatINR(o.total)} · {o.months.length} {o.months.length === 1 ? "month" : "months"}
                        </span>
                      </Link>
                      <ReminderSheet
                        title="Fee reminder"
                        type="fee"
                        feeRecordId={o.latestFeeId}
                        studentId={o.studentId}
                        studentName={o.studentName}
                        recipients={o.recipients.map((r) => ({
                          label: r.label,
                          parentName: r.name,
                          phone: r.phone,
                          message: feeReminderMessage({
                            parentName: r.name,
                            studentName: o.studentName,
                            amount: o.total,
                            months: o.months,
                            centreName: centre.name,
                          }),
                        }))}
                      />
                    </li>
                  ))}
                </ul>
                {overdueCount > 1 && (
                  <Button asChild variant="outline" className="mt-4 w-full">
                    <Link href="/fees/remind">
                      <BellRing aria-hidden /> Remind all {overdueCount}
                    </Link>
                  </Button>
                )}
              </>
            )}
          </Card>

          {/* 4. Low attendance */}
          <Card title="Low attendance" icon={TrendingDown} subtitle="Below 75% in the last 30 days">
            {!low?.length ? (
              <p className="flex items-center gap-2 text-base text-muted-foreground">
                <CircleCheck className="size-5 text-success" aria-hidden /> Everyone is attending well.
              </p>
            ) : (
              <ul className="grid grid-cols-1 gap-2">
                {low.map((s) => (
                  <li key={s.student_id}>
                    <Link
                      href={`/students/${s.student_id}`}
                      className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted/60"
                    >
                      <InitialsAvatar name={s.student_name} className="size-10 text-sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-base leading-snug font-semibold">{s.student_name}</span>
                        <span className="block text-sm text-muted-foreground">
                          {s.recent_present} of {s.recent_total} {s.recent_total === 1 ? "day" : "days"} present
                        </span>
                      </span>
                      <span className="inline-flex h-8 items-center gap-1 rounded-full bg-danger-soft px-3 text-sm font-bold text-danger">
                        <TrendingDown className="size-4" aria-hidden /> {s.percent}%
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function Card({
  title,
  subtitle,
  icon: Icon,
  href,
  linkLabel,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: typeof CalendarCheck;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-card p-5 shadow-sm ring-1 ring-foreground/8">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25">
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg leading-snug font-bold">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {href && (
          <Link
            href={href}
            className="flex h-10 shrink-0 items-center gap-0.5 rounded-lg px-2 text-sm font-semibold text-primary hover:bg-accent"
          >
            {linkLabel} <ChevronRight className="size-4" aria-hidden />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/** First-run checklist: batch → student → attendance. */
function GettingStarted({ hasBatches }: { hasBatches: boolean }) {
  const steps = [
    {
      done: hasBatches,
      title: "Create a batch",
      text: "Add a class with its days, time and monthly fee.",
      href: "/batches/new",
      icon: Layers,
    },
    {
      done: false,
      title: "Add your students",
      text: "Name, batch and the parent’s WhatsApp number.",
      href: "/students/new",
      icon: UserPlus,
    },
    {
      done: false,
      title: "Mark attendance",
      text: "Everyone is present by default. Tap only the absent ones.",
      href: "/attendance",
      icon: CalendarCheck,
    },
  ];
  const next = steps.findIndex((s) => !s.done);

  return (
    <section className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/8">
      <h2 className="text-xl font-bold">Let’s set up your centre</h2>
      <p className="text-base text-muted-foreground">Three quick steps and you’re ready.</p>
      <ol className="mt-5 grid gap-3">
        {steps.map((s, i) => {
          const Icon = s.done ? Check : s.icon;
          const isNext = i === next;
          return (
            <li
              key={s.title}
              className={cn(
                "flex items-center gap-4 rounded-xl p-3 ring-1",
                isNext ? "bg-accent ring-primary/30" : "ring-foreground/8",
                s.done && "opacity-70",
              )}
            >
              <span
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-full",
                  s.done ? "bg-success-soft text-success" : isNext ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block text-base font-semibold", s.done && "line-through")}>
                  {i + 1}. {s.title}
                </span>
                <span className="block text-sm text-muted-foreground">{s.done ? "Done" : s.text}</span>
              </span>
            </li>
          );
        })}
      </ol>
      {next >= 0 && (
        <Button asChild size="lg" className="mt-5 w-full">
          <Link href={steps[next].href}>{steps[next].title}</Link>
        </Button>
      )}
    </section>
  );
}

function HeroStat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl bg-white/12 p-3 ring-1 ring-white/15 backdrop-blur">
      <dt className="text-[11px] font-semibold tracking-wide text-indigo-100/85 uppercase">{label}</dt>
      <dd className="mt-0.5 text-xl leading-tight font-extrabold">{value}</dd>
      <dd className="truncate text-xs text-indigo-100/80">{note}</dd>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  tone,
}: {
  href: string;
  icon: typeof CalendarCheck;
  label: string;
  tone: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center gap-2 rounded-2xl bg-card px-1 py-3 text-center shadow-sm ring-1 ring-foreground/8 transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <span className={`flex size-11 items-center justify-center rounded-2xl bg-linear-to-br text-white shadow-md ${tone}`}>
        <Icon className="size-5.5" aria-hidden />
      </span>
      <span className="text-[0.8rem] leading-tight font-semibold">{label}</span>
    </Link>
  );
}
