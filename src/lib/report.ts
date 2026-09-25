import { addMonths } from "@/lib/calendar";
import { formatDate, formatMonth } from "@/lib/format";
import { percentOf } from "@/lib/marks";

/* ------------------------------------------------------------------ */
/* Report period                                                       */
/* ------------------------------------------------------------------ */

export const PERIODS = [
  { value: "this-month", label: "This month" },
  { value: "last-3-months", label: "Last 3 months" },
  { value: "session", label: "This academic year (Apr–Mar)" },
] as const;
export type PeriodPreset = (typeof PERIODS)[number]["value"];

/** Date range for a preset. The academic year in India runs April → March. */
export function periodRange(preset: PeriodPreset, today: string): { from: string; to: string; label: string } {
  const month = today.slice(0, 7);
  if (preset === "this-month") {
    return { from: `${month}-01`, to: today, label: formatMonth(`${month}-01`) };
  }
  if (preset === "last-3-months") {
    const start = addMonths(month, -2);
    return {
      from: `${start}-01`,
      to: today,
      label: `${formatMonth(`${start}-01`)} – ${formatMonth(`${month}-01`)}`,
    };
  }
  const year = Number(today.slice(0, 4));
  const startYear = Number(today.slice(5, 7)) >= 4 ? year : year - 1;
  return {
    from: `${startYear}-04-01`,
    to: today,
    label: `Academic year ${startYear}–${String(startYear + 1).slice(2)}`,
  };
}

/** Label for any custom range, e.g. "01 Aug 2026 – 25 Sep 2026" */
export function rangeLabel(from: string, to: string) {
  return `${formatDate(from)} – ${formatDate(to)}`;
}

/* ------------------------------------------------------------------ */
/* Attendance                                                          */
/* ------------------------------------------------------------------ */

type AttendanceRow = { date: string; status: "present" | "absent" };

export function summarizeAttendance(rows: AttendanceRow[], from: string, to: string) {
  const inRange = rows.filter((r) => r.date >= from && r.date <= to);
  const present = inRange.filter((r) => r.status === "present").length;
  const total = inRange.length;

  const months: string[] = [];
  for (let m = from.slice(0, 7); m <= to.slice(0, 7); m = addMonths(m, 1)) months.push(m);

  const byMonth = months
    .map((m) => {
      const monthRows = inRange.filter((r) => r.date.startsWith(m));
      const monthPresent = monthRows.filter((r) => r.status === "present").length;
      return {
        month: m,
        label: formatMonth(`${m}-01`),
        total: monthRows.length,
        present: monthPresent,
        absent: monthRows.length - monthPresent,
        percent: monthRows.length ? percentOf(monthPresent, monthRows.length) : null,
      };
    })
    .filter((m) => m.total > 0 || m.month === to.slice(0, 7));

  return {
    total,
    present,
    absent: total - present,
    percent: total ? percentOf(present, total) : null,
    byMonth,
  };
}

/* ------------------------------------------------------------------ */
/* Marks                                                               */
/* ------------------------------------------------------------------ */

type MarkRow = {
  marks: number | null;
  absent: boolean;
  test: { name: string; subject: string; test_date: string; max_marks: number };
};

/** Friendly word for a percentage (shown next to the number, never instead of it). */
export function performanceLabel(percent: number): string {
  if (percent >= 90) return "Excellent";
  if (percent >= 75) return "Very good";
  if (percent >= 60) return "Good";
  if (percent >= 40) return "Fair";
  return "Needs improvement";
}

export function summarizeMarks(rows: MarkRow[], from: string, to: string) {
  const tests = rows
    .filter((r) => r.test.test_date >= from && r.test.test_date <= to)
    .sort((a, b) => a.test.test_date.localeCompare(b.test.test_date))
    .map((r) => {
      const max = Number(r.test.max_marks);
      const wrote = !r.absent && r.marks !== null;
      const percent = wrote ? percentOf(Number(r.marks), max) : null;
      return {
        name: r.test.name,
        subject: r.test.subject.trim(),
        date: r.test.test_date,
        marks: wrote ? Number(r.marks) : null,
        max,
        absent: !wrote,
        percent,
        label: percent === null ? "Absent" : performanceLabel(percent),
      };
    });

  const written = tests.filter((t) => t.percent !== null);
  const average = written.length
    ? Math.round(written.reduce((s, t) => s + (t.percent as number), 0) / written.length)
    : null;

  // Average per subject (tests without a subject are grouped as "General")
  const subjects = new Map<string, number[]>();
  for (const t of written) {
    const key = t.subject || "General";
    subjects.set(key, [...(subjects.get(key) ?? []), t.percent as number]);
  }
  const bySubject = [...subjects.entries()]
    .map(([subject, pcts]) => {
      const avg = Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
      return { subject, tests: pcts.length, average: avg, label: performanceLabel(avg) };
    })
    .sort((a, b) => b.average - a.average);

  return {
    tests,
    written: written.length,
    missed: tests.length - written.length,
    average,
    averageLabel: average === null ? null : performanceLabel(average),
    bySubject,
  };
}

