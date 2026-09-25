import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { addMonths, monthGrid } from "@/lib/calendar";
import { formatMonth } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AttendanceStatus } from "@/types/database";

type Props = {
  month: string; // "yyyy-MM"
  marks: Record<string, AttendanceStatus>; // "yyyy-MM-dd" -> status
  today: string;
  /** builds the link for another month, e.g. m => `/students/1?month=${m}` */
  hrefForMonth: (month: string) => string;
};

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

/** Month view: ✓ green = present, ✕ red = absent, plain = not marked. */
export function AttendanceCalendar({ month, marks, today, hrefForMonth }: Props) {
  const weeks = monthGrid(month);
  const values = Object.entries(marks).filter(([d]) => d.startsWith(month));
  const present = values.filter(([, s]) => s === "present").length;
  const absent = values.length - present;
  const canGoForward = month < today.slice(0, 7);

  const nav =
    "flex size-11 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-muted";

  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/8">
      <div className="flex items-center justify-between">
        <Link href={hrefForMonth(addMonths(month, -1))} scroll={false} replace className={nav} aria-label="Previous month">
          <ChevronLeft className="size-6" />
        </Link>
        <p className="text-lg font-bold">{formatMonth(`${month}-01`)}</p>
        {canGoForward ? (
          <Link href={hrefForMonth(addMonths(month, 1))} scroll={false} replace className={nav} aria-label="Next month">
            <ChevronRight className="size-6" />
          </Link>
        ) : (
          <span className={cn(nav, "opacity-30")} aria-hidden>
            <ChevronRight className="size-6" />
          </span>
        )}
      </div>

      <table className="mt-3 w-full table-fixed border-separate border-spacing-1 text-center">
        <thead>
          <tr>
            {WEEKDAYS.map((d, i) => (
              <th key={i} scope="col" className="pb-1 text-sm font-semibold text-muted-foreground">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi}>
              {week.map((day, di) => {
                if (!day) return <td key={di} />;
                const status = marks[day];
                const dayNum = Number(day.slice(8));
                return (
                  <td key={di} className="p-0">
                    <div
                      title={status ? `${dayNum}: ${status}` : undefined}
                      className={cn(
                        "mx-auto flex aspect-square max-w-12 flex-col items-center justify-center rounded-xl text-[0.95rem] font-semibold",
                        status === "present" && "bg-success-soft text-success",
                        status === "absent" && "bg-danger-soft text-danger",
                        !status && "text-muted-foreground",
                        day === today && "ring-2 ring-primary",
                        day > today && "opacity-40",
                      )}
                    >
                      <span className="leading-none">{dayNum}</span>
                      {status === "present" && <Check className="mt-0.5 size-3.5" aria-label="present" />}
                      {status === "absent" && <X className="mt-0.5 size-3.5" aria-label="absent" />}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm">
        <span className="inline-flex items-center gap-1.5 font-semibold text-success">
          <Check className="size-4" aria-hidden /> {present} present
        </span>
        <span className="inline-flex items-center gap-1.5 font-semibold text-danger">
          <X className="size-4" aria-hidden /> {absent} absent
        </span>
        {values.length === 0 && <span className="text-muted-foreground">No attendance marked this month</span>}
      </div>
    </div>
  );
}
