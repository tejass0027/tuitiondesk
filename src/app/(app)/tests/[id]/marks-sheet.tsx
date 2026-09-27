"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, CircleCheck, Loader2, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InitialsAvatar } from "@/components/shared/initials-avatar";
import { ReminderSheet } from "@/components/reminders/reminder-sheet";
import { formatMarks, parseMarksInput, percentOf, resultMessage, scoreBand, summarizeMarks } from "@/lib/marks";
import { cn } from "@/lib/utils";
import { messageRecipients, type ContactParent } from "@/lib/parents";
import { saveMarks } from "../actions";

type SheetStudent = {
  id: string;
  name: string;
  parent_name: string;
  parent_whatsapp: string;
  father_name: string;
  father_phone: string | null;
  mother_name: string;
  mother_phone: string | null;
  contact_parent: ContactParent;
};
type Saved = { marks: number | null; absent: boolean };
type Row = { text: string; absent: boolean };

type Props = {
  test: { id: string; name: string; subject: string; test_date: string; max_marks: number };
  students: SheetStudent[];
  saved: Record<string, Saved>;
  centreName: string;
};

const BAND_STYLE = {
  good: "bg-success-soft text-success",
  average: "bg-warning-soft text-warning",
  low: "bg-danger-soft text-danger",
};

/** Type each student's marks (or mark Absent), then one Save for the whole test. */
export function MarksSheet({ test, students, saved, centreName }: Props) {
  const max = Number(test.max_marks);
  const toRows = (from: Record<string, Saved>) =>
    Object.fromEntries(
      students.map((s) => [
        s.id,
        { text: from[s.id]?.marks != null ? formatMarks(from[s.id].marks) : "", absent: from[s.id]?.absent ?? false },
      ]),
    ) as Record<string, Row>;

  const [rows, setRows] = useState(() => toRows(saved));
  const [lastSaved, setLastSaved] = useState(() => toRows(saved));
  const [pending, startTransition] = useTransition();
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // Work out each row's number and whether it's valid
  const parsed = students.map((s) => {
    const row = rows[s.id];
    const value = row.absent ? null : parseMarksInput(row.text);
    const invalid = !row.absent && value !== null && (Number.isNaN(value) || value > max);
    return { student: s, row, value, invalid };
  });
  const hasErrors = parsed.some((p) => p.invalid);
  const isDirty = students.some((s) => rows[s.id].text !== lastSaved[s.id].text || rows[s.id].absent !== lastSaved[s.id].absent);
  const summary = summarizeMarks(
    parsed.filter((p) => !p.invalid).map((p) => ({ marks: p.value, absent: p.row.absent })),
    max,
  );
  const filled = parsed.filter((p) => p.row.absent || (p.value !== null && !p.invalid)).length;

  function update(id: string, patch: Partial<Row>) {
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function save() {
    if (hasErrors) {
      toast.error(`Fix the marks in red first (0 to ${formatMarks(max)})`);
      return;
    }
    startTransition(async () => {
      const result = await saveMarks({
        testId: test.id,
        entries: parsed.map((p) => ({
          studentId: p.student.id,
          marks: p.row.absent ? null : (p.value as number | null),
          absent: p.row.absent,
        })),
      });
      if (result?.ok) {
        toast.success(result.message);
        setLastSaved(rows);
      } else {
        toast.error(result?.message ?? "Could not save marks");
      }
    });
  }

  const savedEntries = students.filter((s) => lastSaved[s.id].absent || lastSaved[s.id].text !== "");

  return (
    <div className="grid grid-cols-1 gap-3">
      {/* Class summary */}
      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-card p-4 text-center shadow-sm ring-1 ring-foreground/8">
        <Stat label="Entered" value={`${filled}/${students.length}`} />
        <Stat label="Class average" value={summary.averagePercent === null ? "–" : `${summary.averagePercent}%`} />
        <Stat label="Highest" value={summary.highest === null ? "–" : `${formatMarks(summary.highest)}/${formatMarks(max)}`} />
      </div>
      <p className="text-sm text-muted-foreground">
        Type marks out of {formatMarks(max)}. Leave a box empty if you don’t have the marks yet.
      </p>

      <ul className="grid grid-cols-1 gap-2">
        {parsed.map(({ student: s, row, value, invalid }, i) => {
          const pct = value !== null && !invalid ? percentOf(value, max) : null;
          return (
            <li
              key={s.id}
              className={cn(
                "rounded-2xl p-3 ring-1 transition-colors",
                row.absent ? "bg-muted ring-foreground/8" : "bg-card shadow-sm ring-foreground/8",
                invalid && "ring-2 ring-danger",
              )}
            >
              <div className="flex items-center gap-3">
                <InitialsAvatar name={s.name} className="size-10 text-sm" />
                <label htmlFor={`marks-${s.id}`} className="min-w-0 flex-1 text-lg leading-snug font-semibold break-words">
                  {s.name}
                </label>
                {pct !== null && (
                  <span className={cn("rounded-full px-2.5 py-0.5 text-sm font-bold", BAND_STYLE[scoreBand(pct)])}>
                    {pct}%
                  </span>
                )}
              </div>

              <div className="mt-2 flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    id={`marks-${s.id}`}
                    ref={(el) => {
                      inputs.current[i] = el;
                    }}
                    inputMode="decimal"
                    enterKeyHint={i < students.length - 1 ? "next" : "done"}
                    autoComplete="off"
                    placeholder={row.absent ? "Absent" : "Marks"}
                    disabled={row.absent}
                    value={row.absent ? "" : row.text}
                    onChange={(e) => update(s.id, { text: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const next = inputs.current.slice(i + 1).find((el) => el && !el.disabled);
                        if (next) next.focus();
                        else (e.target as HTMLInputElement).blur();
                      }
                    }}
                    aria-invalid={invalid}
                    aria-describedby={invalid ? `marks-${s.id}-error` : undefined}
                    className="pr-16 text-xl font-bold"
                  />
                  <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-base font-semibold text-muted-foreground">
                    / {formatMarks(max)}
                  </span>
                </div>
                <Button
                  type="button"
                  variant={row.absent ? "danger" : "outline"}
                  aria-pressed={row.absent}
                  onClick={() => update(s.id, { absent: !row.absent })}
                  className="shrink-0"
                >
                  <UserX aria-hidden /> Absent
                </Button>
              </div>
              {invalid && (
                <p id={`marks-${s.id}-error`} className="mt-1.5 text-sm font-medium text-danger" role="alert">
                  {Number.isNaN(value) ? "Enter a number like 42 or 42.5" : `Can’t be more than ${formatMarks(max)}`}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {/* Save bar above the bottom tabs */}
      <div className="sticky bottom-[calc(6rem+env(safe-area-inset-bottom))] z-30 mt-2 lg:bottom-6">
        <div className="rounded-2xl bg-background/80 p-1 backdrop-blur">
          {isDirty ? (
            <Button size="lg" className="w-full shadow-lg shadow-primary/25" onClick={save} disabled={pending}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}
              {pending ? "Saving…" : "Save marks"}
            </Button>
          ) : (
            <p className="flex h-14 items-center justify-center gap-2 rounded-xl bg-success-soft text-base font-semibold text-success">
              <CircleCheck className="size-5" aria-hidden />
              {savedEntries.length ? "All marks saved" : "No marks entered yet"}
            </p>
          )}
        </div>
      </div>

      {/* Share results with parents once saved */}
      {!isDirty && savedEntries.length > 0 && (
        <section className="mt-2 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/8">
          <h2 className="text-lg font-bold">Share results with parents</h2>
          <p className="text-sm text-muted-foreground">Sends each parent their child’s marks on WhatsApp.</p>
          <ul className="mt-3 grid grid-cols-1 gap-2">
            {savedEntries.map((s) => {
              const saved = lastSaved[s.id];
              const marks = saved.absent ? null : parseMarksInput(saved.text);
              return (
                <li key={s.id} className="flex items-center gap-3">
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold">{s.name}</span>
                    <span className="block text-sm text-muted-foreground">
                      {saved.absent ? "Absent" : `${saved.text}/${formatMarks(max)}`}
                    </span>
                  </span>
                  <ReminderSheet
                    title="Share result"
                    type="result"
                    triggerLabel="Send"
                    studentId={s.id}
                    studentName={s.name}
                    recipients={messageRecipients(s).map((r) => ({
                      label: r.label,
                      parentName: r.name,
                      phone: r.phone,
                      message: resultMessage({
                        parentName: r.name,
                        studentName: s.name,
                        testName: test.name,
                        subject: test.subject,
                        testDate: test.test_date,
                        marks,
                        absent: saved.absent,
                        maxMarks: max,
                        centreName,
                      }),
                    }))}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
