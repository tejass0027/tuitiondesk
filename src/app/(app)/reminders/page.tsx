import type { Metadata } from "next";
import Link from "next/link";
import { CalendarX, IndianRupee, MessageCircle, MessageSquareText, NotebookPen } from "lucide-react";
import { getCentre } from "@/lib/auth";
import { formatDate, todayIST } from "@/lib/format";
import { addDays } from "@/lib/calendar";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import type { ReminderType } from "@/types/database";

export const metadata: Metadata = { title: "Reminder log" };

const TYPE_INFO: Record<ReminderType, { label: string; icon: typeof IndianRupee; className: string }> = {
  fee: { label: "Fee", icon: IndianRupee, className: "bg-warning-soft text-warning" },
  absence: { label: "Absence", icon: CalendarX, className: "bg-danger-soft text-danger" },
  custom: { label: "Message", icon: MessageSquareText, className: "bg-accent text-accent-foreground" },
  result: { label: "Result", icon: NotebookPen, className: "bg-success-soft text-success" },
};

/** "yyyy-MM-dd" of a timestamp, in India time */
function istDate(ts: string) {
  return todayIST(new Date(ts));
}

function istTime(ts: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(new Date(ts))
    .toUpperCase(); // "5:22 PM"
}

export default async function RemindersPage() {
  const { supabase } = await getCentre();
  const { data: logs } = await supabase
    .from("reminder_logs")
    .select("id, type, message, sent_at, student_id, students(name, parent_name)")
    .order("sent_at", { ascending: false })
    .limit(200);

  // Group by day: Today / Yesterday / 23 Sep 2026
  const today = todayIST();
  const groups = new Map<string, NonNullable<typeof logs>>();
  for (const log of logs ?? []) {
    const day = istDate(log.sent_at);
    groups.set(day, [...(groups.get(day) ?? []), log]);
  }
  const dayLabel = (d: string) => (d === today ? "Today" : d === addDays(today, -1) ? "Yesterday" : formatDate(d));

  return (
    <>
      <PageHeader
        title="Reminder log"
        backHref="/more"
        description="Every WhatsApp message you opened, newest first."
      />

      {!logs?.length ? (
        <EmptyState
          icon={MessageCircle}
          title="No reminders yet"
          description="When you send a fee or absence reminder from the Fees or Attendance screen, it shows up here."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {[...groups.entries()].map(([day, items]) => (
            <section key={day}>
              <h2 className="mb-2 text-base font-bold text-muted-foreground">{dayLabel(day)}</h2>
              <ul className="grid grid-cols-1 gap-2.5">
                {items.map((log) => {
                  const info = TYPE_INFO[log.type];
                  const Icon = info.icon;
                  return (
                    <li key={log.id} className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/8">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-sm font-semibold ${info.className}`}
                        >
                          <Icon className="size-4" aria-hidden /> {info.label}
                        </span>
                        <Link
                          href={`/students/${log.student_id}`}
                          className="min-w-0 flex-1 truncate text-base font-semibold hover:underline"
                        >
                          {log.students?.name ?? "Student"}
                        </Link>
                        <span className="shrink-0 text-sm text-muted-foreground">{istTime(log.sent_at)}</span>
                      </div>
                      <p className="mt-2 line-clamp-3 text-[0.95rem] whitespace-pre-line text-muted-foreground">
                        {log.message}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
