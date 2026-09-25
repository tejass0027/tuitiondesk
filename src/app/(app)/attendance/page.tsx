import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, Layers, Plus, UserPlus } from "lucide-react";
import { getCentre } from "@/lib/auth";
import { dayKeyOf, formatTimeRange } from "@/lib/batches";
import { isISODate } from "@/lib/calendar";
import { todayIST } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import type { AttendanceStatus } from "@/types/database";
import { DateBar } from "./date-bar";
import { AttendanceSheet } from "./attendance-sheet";

export const metadata: Metadata = { title: "Attendance" };

export default async function AttendancePage({ searchParams }: PageProps<"/attendance">) {
  const params = await searchParams;
  const today = todayIST();
  const date = isISODate(params.date) && params.date <= today ? params.date : today;

  const { supabase } = await getCentre();
  const { data: batches } = await supabase
    .from("batches")
    .select("id, name, days, start_time, end_time")
    .eq("is_active", true)
    .order("start_time", { nullsFirst: false })
    .order("name");

  if (!batches?.length) {
    return (
      <>
        <PageHeader title="Attendance" />
        <EmptyState
          icon={Layers}
          title="No batches yet"
          description="Create a batch and add students to it. Then you can mark attendance here."
          action={
            <Button asChild size="lg">
              <Link href="/batches/new">
                <Plus aria-hidden /> Add a batch
              </Link>
            </Button>
          }
        />
      </>
    );
  }

  // Batches that meet on this weekday come first and get a "Today" dot
  const dayKey = dayKeyOf(date);
  const scheduled = batches.filter((b) => b.days.includes(dayKey));
  const ordered = [...scheduled, ...batches.filter((b) => !b.days.includes(dayKey))];
  const requested = typeof params.batch === "string" ? params.batch : "";
  const batch = ordered.find((b) => b.id === requested) ?? ordered[0];

  const [{ data: students }, { data: marks }, { count: batchSize }] = await Promise.all([
    supabase
      .from("students")
      .select("id, name, class")
      .eq("batch_id", batch.id)
      .eq("is_active", true)
      .lte("joining_date", date)
      .order("name"),
    supabase.from("attendance").select("student_id, status").eq("batch_id", batch.id).eq("date", date),
    supabase
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("batch_id", batch.id)
      .eq("is_active", true),
  ]);

  const saved: Record<string, AttendanceStatus> = Object.fromEntries(
    (marks ?? []).map((m) => [m.student_id, m.status]),
  );
  const isScheduled = batch.days.includes(dayKey);

  return (
    <>
      <PageHeader title="Attendance" />

      <div className="grid grid-cols-1 gap-4">
        <DateBar date={date} today={today} />

        <nav
          aria-label="Choose batch"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0"
        >
          {ordered.map((b) => {
            const active = b.id === batch.id;
            const meetsToday = b.days.includes(dayKey);
            return (
              <Link
                key={b.id}
                href={`/attendance?batch=${b.id}&date=${date}`}
                replace
                scroll={false}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "flex min-h-12 shrink-0 flex-col justify-center rounded-2xl border px-4 py-1.5 text-left transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-card hover:bg-muted",
                )}
              >
                <span className="flex items-center gap-1.5 text-[0.95rem] font-semibold whitespace-nowrap">
                  {meetsToday && (
                    <span
                      className={cn("size-2 rounded-full", active ? "bg-primary-foreground" : "bg-success")}
                      aria-label="Scheduled on this day"
                    />
                  )}
                  {b.name}
                </span>
                {b.start_time && (
                  <span className={cn("text-xs", active ? "text-primary-foreground/80" : "text-muted-foreground")}>
                    {formatTimeRange(b.start_time, b.end_time)}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {!isScheduled && (
          <p className="rounded-xl bg-muted px-4 py-3 text-[0.95rem] text-muted-foreground">
            <CalendarCheck className="mr-1.5 inline size-4 align-[-2px]" aria-hidden />
            {batch.name} doesn’t normally meet on this day. You can still mark it if there was an extra class.
          </p>
        )}

        {!students?.length && batchSize ? (
          <EmptyState
            icon={CalendarCheck}
            title="Nobody had joined yet"
            description={`No student in ${batch.name} had joined on this date. Pick a later date.`}
          />
        ) : !students?.length ? (
          <EmptyState
            icon={UserPlus}
            title="No students in this batch"
            description="Add students to this batch and they’ll show up here, ready to mark."
            action={
              <Button asChild size="lg">
                <Link href={`/students/new?batch=${batch.id}`}>
                  <Plus aria-hidden /> Add a student
                </Link>
              </Button>
            }
          />
        ) : (
          <AttendanceSheet
            // a fresh sheet for every batch/date, so no ticks leak between them
            key={`${batch.id}-${date}`}
            batchId={batch.id}
            date={date}
            students={students}
            saved={saved}
          />
        )}
      </div>
    </>
  );
}
