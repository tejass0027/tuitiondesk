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
  ReceiptIndianRupee,
  TrendingDown,
  UserPlus,
} from "lucide-react";
import { getCentre } from "@/lib/auth";
import { WEEK_DAYS, dayKeyOf, formatTimeRange } from "@/lib/batches";
import { formatDate, formatINR, formatMonth, todayIST } from "@/lib/format";
import { summarizeFees } from "@/lib/fees";
import { feeSeries, lastMonths, lowAttendance } from "@/lib/dashboard";
import { groupOverdueByStudent } from "@/lib/reminders";
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

  const [
    { data: batches },
    { data: activeStudents },
    { data: todaysMarks },
    { data: fees },
    { data: overdueRows },
    { data: stats },
  ] = await Promise.all([
    supabase.from("batches").select("id, name, days, start_time, end_time").eq("is_active", true).order("start_time", { nullsFirst: false }),
    supabase.from("students").select("id, batch_id").eq("is_active", true).lte("joining_date", today),
    supabase.from("attendance").select("batch_id, student_id").eq("date", today),
    supabase
      .from("fee_overview")
      .select("month, amount_due, amount_paid, balance")
      .gte("month", `${months[0]}-01`),
    supabase
      .from("fee_overview")
      .select("id, student_id, student_name, parent_name, parent_whatsapp, batch_name, month, balance")
      .eq("status", "overdue")
      .order("month"),
    supabase
      .from("student_attendance_stats")
      .select("student_id, student_name, recent_total, recent_present")
      .eq("is_active", true),
  ]);

  const hasBatches = Boolean(batches?.length);
  const hasStudents = Boolean(activeStudents?.length);

  // Today's batches + whether attendance is done
  const todaysBatches = (batches ?? [])
    .filter((b) => b.days.includes(dayKey))
    .map((b) => {
      const size = (activeStudents ?? []).filter((s) => s.batch_id === b.id).length;
      const marked = new Set((todaysMarks ?? []).filter((m) => m.batch_id === b.id).map((m) => m.student_id)).size;
      return { ...b, size, marked, done: size > 0 && marked >= size };
    });

  // Fees
  const thisMonth = summarizeFees((fees ?? []).filter((f) => f.month.startsWith(today.slice(0, 7))));
  const series = feeSeries(fees ?? [], months);
  const overdue = groupOverdueByStudent(overdueRows ?? []).sort((a, b) => b.total - a.total);
  const overdueTotal = overdue.reduce((s, o) => s + o.total, 0);

  // Attendance below 75% (last 30 days)
  const low = lowAttendance(stats ?? []);

  const weekday = WEEK_DAYS.find((d) => d.key === dayKey)!.label;

  return (
    <div className="grid grid-cols-1 gap-6">
      <header className="pt-1">
        <p className="text-base font-medium text-muted-foreground">
          {weekday}, {formatDate(today)}
        </p>
        <h1 className="text-[1.75rem] leading-tight font-bold">Namaste 🙏</h1>
        <p className="text-base text-muted-foreground">{centre.name}</p>
      </header>

      {!hasBatches || !hasStudents ? (
        <GettingStarted hasBatches={hasBatches} />
      ) : (
        <>
          {/* 1. Today's batches */}
          <Card title="Today's batches" icon={CalendarCheck} href="/attendance" linkLabel="Attendance">
            {todaysBatches.length === 0 ? (
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
            subtitle={overdue.length ? `${overdue.length} students · ${formatINR(overdueTotal)}` : undefined}
          >
            {overdue.length === 0 ? (
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
                        recipient={{
                          studentId: o.studentId,
                          studentName: o.studentName,
                          parentName: o.parentName,
                          phone: o.phone,
                        }}
                        initialMessage={feeReminderMessage({
                          parentName: o.parentName,
                          studentName: o.studentName,
                          amount: o.total,
                          months: o.months,
                          centreName: centre.name,
                        })}
                      />
                    </li>
                  ))}
                </ul>
                {overdue.length > 1 && (
                  <Button asChild variant="outline" className="mt-4 w-full">
                    <Link href="/fees/remind">
                      <BellRing aria-hidden /> Remind all {overdue.length}
                    </Link>
                  </Button>
                )}
              </>
            )}
          </Card>

          {/* 4. Low attendance */}
          <Card title="Low attendance" icon={TrendingDown} subtitle="Below 75% in the last 30 days">
            {low.length === 0 ? (
              <p className="flex items-center gap-2 text-base text-muted-foreground">
                <CircleCheck className="size-5 text-success" aria-hidden /> Everyone is attending well.
              </p>
            ) : (
              <ul className="grid grid-cols-1 gap-2">
                {low.slice(0, 8).map((s) => (
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
    <section className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/8">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
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
