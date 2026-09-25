"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, CircleCheck, Loader2, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InitialsAvatar } from "@/components/shared/initials-avatar";
import { ReminderSheet } from "@/components/reminders/reminder-sheet";
import { absenceMessage } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import type { AttendanceStatus } from "@/types/database";
import { saveAttendance } from "./actions";

type SheetStudent = {
  id: string;
  name: string;
  class: string;
  parent_name: string;
  parent_whatsapp: string;
};

type Props = {
  batchId: string;
  batchName: string;
  centreName: string;
  today: string;
  date: string;
  students: SheetStudent[];
  /** statuses already saved for this batch + date (empty if not marked yet) */
  saved: Record<string, AttendanceStatus>;
};

/**
 * Everyone starts as Present; tap a student to flip them to Absent.
 * Nothing is sent to the server until "Save".
 */
export function AttendanceSheet({ batchId, batchName, centreName, today, date, students, saved }: Props) {
  const alreadyMarked = Object.keys(saved).length > 0;
  const initial = () =>
    Object.fromEntries(students.map((s) => [s.id, saved[s.id] ?? "present"])) as Record<string, AttendanceStatus>;

  const [statuses, setStatuses] = useState(initial);
  const [lastSaved, setLastSaved] = useState(() => (alreadyMarked ? initial() : null));
  const [pending, startTransition] = useTransition();

  const absentCount = students.filter((s) => statuses[s.id] === "absent").length;
  const presentCount = students.length - absentCount;
  const isDirty = !lastSaved || students.some((s) => statuses[s.id] !== lastSaved[s.id]);

  function toggle(id: string) {
    setStatuses((prev) => ({ ...prev, [id]: prev[id] === "present" ? "absent" : "present" }));
  }

  function save() {
    startTransition(async () => {
      const result = await saveAttendance({
        batchId,
        date,
        entries: students.map((s) => ({ studentId: s.id, status: statuses[s.id] })),
      });
      if (result?.ok) {
        toast.success(result.message);
        setLastSaved(statuses);
      } else {
        toast.error(result?.message ?? "Could not save attendance");
      }
    });
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {/* Summary + helper */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-base">
          <span className="font-bold text-success">{presentCount} present</span>
          <span className="text-muted-foreground"> · </span>
          <span className={cn("font-bold", absentCount ? "text-danger" : "text-muted-foreground")}>
            {absentCount} absent
          </span>
        </p>
        {absentCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStatuses(Object.fromEntries(students.map((s) => [s.id, "present"])))}
          >
            <RotateCcw aria-hidden /> All present
          </Button>
        )}
      </div>
      <p className="-mt-1 text-sm text-muted-foreground">Tap a student to mark them absent.</p>

      <ul className="grid grid-cols-1 gap-2">
        {students.map((s) => {
          const present = statuses[s.id] === "present";
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => toggle(s.id)}
                aria-pressed={!present}
                aria-label={`${s.name}: ${present ? "present" : "absent"}. Tap to change.`}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition-colors active:scale-[0.99]",
                  present
                    ? "border-transparent bg-card shadow-sm ring-1 ring-foreground/8"
                    : "border-danger/40 bg-danger-soft",
                )}
              >
                <InitialsAvatar name={s.name} />
                <span className="min-w-0 flex-1">
                  <span className="block text-lg leading-snug font-semibold break-words">{s.name}</span>
                  {s.class && <span className="block text-sm text-muted-foreground">Class {s.class}</span>}
                </span>
                <span
                  className={cn(
                    "flex h-10 min-w-26 shrink-0 items-center justify-center gap-1 rounded-full px-3 text-base font-bold",
                    present ? "bg-success-soft text-success" : "bg-danger text-background",
                  )}
                >
                  {present ? <Check className="size-5" aria-hidden /> : <X className="size-5" aria-hidden />}
                  {present ? "Present" : "Absent"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Save bar: sits just above the bottom tabs on phones */}
      <div className="sticky bottom-[calc(6rem+env(safe-area-inset-bottom))] z-30 mt-2 lg:bottom-6">
        <div className="rounded-2xl bg-background/80 p-1 backdrop-blur">
          {isDirty ? (
            <Button size="lg" className="w-full shadow-lg shadow-primary/25" onClick={save} disabled={pending}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}
              {pending ? "Saving…" : lastSaved ? "Update attendance" : `Save attendance (${students.length})`}
            </Button>
          ) : (
            <p className="flex h-14 items-center justify-center gap-2 rounded-xl bg-success-soft text-base font-semibold text-success">
              <CircleCheck className="size-5" aria-hidden /> Attendance saved for this day
            </p>
          )}
        </div>
      </div>

      {/* Once saved, offer to tell parents of absent students */}
      {!isDirty && lastSaved && absentCount > 0 && (
        <section className="mt-2 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/8">
          <h2 className="text-lg font-bold">Tell parents about absences</h2>
          <p className="text-sm text-muted-foreground">Sends a WhatsApp message to each absent student’s parent.</p>
          <ul className="mt-3 grid grid-cols-1 gap-2">
            {students
              .filter((s) => lastSaved[s.id] === "absent")
              .map((s) => (
                <li key={s.id} className="flex items-center gap-3">
                  <span className="min-w-0 flex-1 text-base font-semibold">{s.name}</span>
                  <ReminderSheet
                    title="Absence message"
                    type="absence"
                    triggerLabel="Send"
                    recipient={{
                      studentId: s.id,
                      studentName: s.name,
                      parentName: s.parent_name,
                      phone: s.parent_whatsapp,
                    }}
                    initialMessage={absenceMessage({
                      parentName: s.parent_name,
                      studentName: s.name,
                      date,
                      today,
                      batchName,
                      centreName,
                    })}
                  />
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  );
}
