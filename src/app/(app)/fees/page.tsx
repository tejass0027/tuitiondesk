import type { Metadata } from "next";
import Link from "next/link";
import {
  BellRing,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  MessageCircleMore,
  PartyPopper,
  ReceiptIndianRupee,
  Users,
} from "lucide-react";
import { getCentre } from "@/lib/auth";
import { addMonths, isISOMonth } from "@/lib/calendar";
import { formatDate, formatINR, formatMonth, todayIST } from "@/lib/format";
import { isPartlyPaid, paymentModeLabel, summarizeFees } from "@/lib/fees";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { InitialsAvatar } from "@/components/shared/initials-avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import type { FeeOverview } from "@/types/database";
import { ReminderSheet } from "@/components/reminders/reminder-sheet";
import { feeReminderMessage } from "@/lib/whatsapp";
import { messageRecipients } from "@/lib/parents";
import { PaymentSheet } from "./payment-sheet";
import { ClassFilter } from "@/components/shared/class-filter";

export const metadata: Metadata = { title: "Fees" };

const TABS = [
  { key: "due", label: "Due" },
  { key: "overdue", label: "Overdue" },
  { key: "paid", label: "Paid" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export default async function FeesPage({ searchParams }: PageProps<"/fees">) {
  const params = await searchParams;
  const today = todayIST();
  const currentMonth = today.slice(0, 7);
  const month = isISOMonth(params.month) && params.month <= currentMonth ? params.month : currentMonth;
  const monthStart = `${month}-01`;
  const classFilter = typeof params.class === "string" ? params.class : "";

  const { supabase, centre } = await getCentre();

  // Make sure every active student has this month's fee entry (safe to repeat)
  await supabase.rpc("generate_monthly_fees");

  const [{ data: monthRowsAll }, { data: overdueRowsAll }, { count: studentCount }, { data: classes }] = await Promise.all([
    supabase.from("fee_overview").select("*").eq("month", monthStart).order("student_name"),
    // Overdue includes older months that are still unpaid
    supabase
      .from("fee_overview")
      .select("*")
      .eq("status", "overdue")
      .lte("month", monthStart)
      .order("month")
      .order("student_name"),
    supabase.from("students").select("id", { count: "exact", head: true }),
    supabase.from("classes").select("name, sort_order").order("sort_order").order("name"),
  ]);

  // Optional ?class= filter (matches the student's class, any capitalisation)
  const inClass = (r: { student_class: string }) =>
    !classFilter || r.student_class.trim().toLowerCase() === classFilter.toLowerCase();
  const monthRows = (monthRowsAll ?? []).filter(inClass);
  const overdueRows = (overdueRowsAll ?? []).filter(inClass);

  const rows = monthRows;
  const overdue = overdueRows;
  const byTab: Record<TabKey, FeeOverview[]> = {
    due: rows.filter((r) => r.status === "due"),
    overdue,
    paid: rows.filter((r) => r.status === "paid"),
  };
  const requestedTab = TABS.find((t) => t.key === params.tab)?.key;
  const tab: TabKey = requestedTab ?? (overdue.length ? "overdue" : "due");
  const list = byTab[tab];

  // How the paid fees were paid (cash / UPI / bank), newest payment wins
  const modeByFee = new Map<string, string>();
  if (tab === "paid" && byTab.paid.length) {
    const { data: payments } = await supabase
      .from("payments")
      .select("fee_record_id, mode")
      .in("fee_record_id", byTab.paid.map((r) => r.id))
      .order("paid_on");
    for (const p of payments ?? []) modeByFee.set(p.fee_record_id, paymentModeLabel(p.mode));
  }

  // When was each unpaid fee last reminded? (helps avoid reminding twice)
  const lastReminded = new Map<string, string>();
  const unpaidIds = list.filter((r) => r.status !== "paid").map((r) => r.id);
  if (unpaidIds.length) {
    const { data: logs } = await supabase
      .from("reminder_logs")
      .select("fee_record_id, sent_at")
      .in("fee_record_id", unpaidIds)
      .order("sent_at");
    for (const l of logs ?? []) if (l.fee_record_id) lastReminded.set(l.fee_record_id, l.sent_at);
  }

  const summary = summarizeFees(rows);
  const olderOverdue = overdue.filter((r) => r.month < monthStart);
  const olderOverdueTotal = olderOverdue.reduce((s, r) => s + Number(r.balance), 0);

  const hrefFor = (m: string, t: TabKey = tab, cls = classFilter) =>
    `/fees?month=${m}&tab=${t}${cls ? `&class=${encodeURIComponent(cls)}` : ""}`;

  if (studentCount === 0) {
    return (
      <>
        <PageHeader title="Fees" />
        <EmptyState
          icon={Users}
          title="No students yet"
          description="Add students and their monthly fees will appear here automatically."
          action={
            <Button asChild size="lg">
              <Link href="/students/new">Add your first student</Link>
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Fees" />

      {/* Month switcher */}
      <div className="flex items-center gap-1 rounded-2xl bg-card p-1.5 shadow-sm ring-1 ring-foreground/8">
        <MonthLink href={hrefFor(addMonths(month, -1))} label="Previous month">
          <ChevronLeft className="size-6" />
        </MonthLink>
        <p className="flex-1 text-center text-lg font-bold">{formatMonth(monthStart)}</p>
        {month < currentMonth ? (
          <MonthLink href={hrefFor(addMonths(month, 1))} label="Next month">
            <ChevronRight className="size-6" />
          </MonthLink>
        ) : (
          <span className="flex size-12 items-center justify-center opacity-30" aria-hidden>
            <ChevronRight className="size-6" />
          </span>
        )}
      </div>

      {classes && classes.length > 0 && (
        <div className="mt-3">
          <ClassFilter classes={classes.map((c) => c.name)} selected={classFilter} baseHref={hrefFor(month, tab, "")} />
        </div>
      )}

      {/* Totals */}
      <section aria-label="Month totals" className="mt-4 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/8">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
              <CircleCheck className="size-4 text-success" aria-hidden /> Collected
            </p>
            <p className="mt-1 text-[1.7rem] leading-tight font-bold text-success">{formatINR(summary.collected)}</p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
              <ReceiptIndianRupee className="size-4 text-warning" aria-hidden /> Pending
            </p>
            <p className="mt-1 text-[1.7rem] leading-tight font-bold text-warning">{formatINR(summary.pending)}</p>
          </div>
        </div>
        <div
          className="mt-4 h-3 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={summary.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Share of this month's fees collected"
        >
          <div className="h-full rounded-full bg-success transition-all" style={{ width: `${summary.percent}%` }} />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {summary.percent}% of {formatINR(summary.expected)} collected for {formatMonth(monthStart)}
        </p>
        {olderOverdueTotal > 0 && (
          <p className="mt-3 rounded-xl bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
            + {formatINR(olderOverdueTotal)} still unpaid from earlier months ({olderOverdue.length})
          </p>
        )}
      </section>

      {/* Tabs */}
      <nav aria-label="Fee status" className="mt-6 grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1.5">
        {TABS.map((t) => {
          const active = t.key === tab;
          const count = byTab[t.key].length;
          return (
            <Link
              key={t.key}
              href={hrefFor(month, t.key)}
              replace
              scroll={false}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-12 items-center justify-center gap-1.5 rounded-xl text-base font-semibold transition-colors",
                active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              <span
                className={cn(
                  "min-w-6 rounded-full px-1.5 text-sm",
                  active && t.key === "overdue" && count ? "bg-danger text-background" : "bg-foreground/10",
                )}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* List */}
      <div className="mt-4 grid grid-cols-1 gap-3">
        {tab === "overdue" && overdue.length > 0 && (
          <Button asChild size="lg" className="w-full">
            <Link href="/fees/remind">
              <BellRing aria-hidden /> Remind all overdue ({new Set(overdue.map((o) => o.student_id)).size})
            </Link>
          </Button>
        )}
        {list.length === 0 ? (
          <EmptyState
            icon={tab === "paid" ? ReceiptIndianRupee : PartyPopper}
            title={tab === "paid" ? "No payments yet" : tab === "overdue" ? "Nothing overdue" : "Nothing due"}
            description={
              tab === "paid"
                ? "Fees you mark as paid this month will show here."
                : "Everyone is up to date. Nice work!"
            }
          />
        ) : (
          <ul className="grid grid-cols-1 gap-2.5">
            {list.map((fee) => (
              <FeeRow
                key={fee.id}
                fee={fee}
                mode={modeByFee.get(fee.id)}
                centreName={centre.name}
                remindedAt={lastReminded.get(fee.id)}
                showMonth={tab === "overdue" && fee.month !== monthStart}
              />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function FeeRow({
  fee,
  mode,
  showMonth,
  centreName,
  remindedAt,
}: {
  fee: FeeOverview;
  mode?: string;
  showMonth: boolean;
  centreName: string;
  remindedAt?: string;
}) {
  const partial = isPartlyPaid(fee);
  const paid = fee.status === "paid";

  return (
    <li className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/8">
      <div className="flex items-start gap-3">
        <InitialsAvatar name={fee.student_name} />
        <div className="min-w-0 flex-1">
          <Link href={`/students/${fee.student_id}`} className="block text-lg leading-snug font-semibold hover:underline">
            {fee.student_name}
          </Link>
          <p className="text-sm text-muted-foreground">
            {[fee.batch_name, showMonth && formatMonth(fee.month)].filter(Boolean).join(" · ")}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {paid
              ? ["Paid", fee.last_paid_on && formatDate(fee.last_paid_on), mode && `· ${mode}`].filter(Boolean).join(" ")
              : partial
                ? `Paid ${formatINR(fee.amount_paid)} of ${formatINR(fee.amount_due)}`
                : `Due by ${formatDate(fee.due_date)}`}
          </p>
        </div>
        <div className="grid shrink-0 justify-items-end gap-1">
          <p className="text-lg font-bold">{formatINR(paid ? fee.amount_due : fee.balance)}</p>
          <StatusBadge status={fee.status} label={partial && fee.status === "due" ? "Part paid" : undefined} />
        </div>
      </div>
      {!paid && (
        <>
          {remindedAt && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MessageCircleMore className="size-4" aria-hidden /> Reminded {formatDate(remindedAt)}
            </p>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
            <ReminderSheet
              title="Fee reminder"
              type="fee"
              feeRecordId={fee.id}
              studentId={fee.student_id}
              studentName={fee.student_name}
              recipients={messageRecipients(fee).map((r) => ({
                label: r.label,
                parentName: r.name,
                phone: r.phone,
                message: feeReminderMessage({
                  parentName: r.name,
                  studentName: fee.student_name,
                  amount: Number(fee.balance),
                  months: [fee.month],
                  centreName,
                }),
              }))}
            />
            <PaymentSheet fee={fee} triggerLabel="Add payment" />
          </div>
        </>
      )}
    </li>
  );
}

function MonthLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      replace
      scroll={false}
      aria-label={label}
      className="flex size-12 items-center justify-center rounded-xl transition-colors hover:bg-muted"
    >
      {children}
    </Link>
  );
}
