import { formatDate } from "@/lib/format";

/** 42.5 -> "42.5", 45 -> "45" (no trailing .00 from the database) */
export function formatMarks(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "–";
  const n = Number(value);
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

/** Whole-number percentage, e.g. 42.5 of 50 -> 85 */
export function percentOf(marks: number, max: number): number {
  if (max <= 0) return 0;
  return Math.round((marks / max) * 100);
}

type MarkEntry = { marks: number | null; absent: boolean };

/** Class summary for one test: how many wrote it, average %, highest and lowest marks. */
export function summarizeMarks(entries: MarkEntry[], max: number) {
  const written = entries.filter((e) => !e.absent && e.marks !== null).map((e) => Number(e.marks));
  const absent = entries.filter((e) => e.absent).length;
  if (written.length === 0) {
    return { written: 0, absent, averagePercent: null, highest: null, lowest: null };
  }
  const total = written.reduce((a, b) => a + b, 0);
  return {
    written: written.length,
    absent,
    averagePercent: percentOf(total / written.length, max),
    highest: Math.max(...written),
    lowest: Math.min(...written),
  };
}

/**
 * Reads what the teacher typed in a marks box.
 * "" -> null (not entered yet), "42.5" -> 42.5, "abc" / "-3" -> NaN (invalid)
 */
export function parseMarksInput(input: string): number | null {
  const cleaned = input.trim().replace(",", ".");
  if (cleaned === "") return null;
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return Number.NaN;
  return Number(cleaned);
}

/** Colour band for a percentage: shown with a label, never colour alone. */
export function scoreBand(percent: number): "good" | "average" | "low" {
  if (percent >= 75) return "good";
  if (percent >= 40) return "average";
  return "low";
}

export function resultMessage(v: {
  parentName: string;
  studentName: string;
  testName: string;
  subject: string;
  testDate: string; // "yyyy-MM-dd"
  marks: number | null;
  absent: boolean;
  maxMarks: number;
  centreName: string;
}): string {
  const hello = v.parentName.trim() ? `Namaste ${v.parentName.trim()}` : "Namaste";
  const test = v.subject.trim() ? `${v.testName} (${v.subject.trim()})` : v.testName;
  if (v.absent || v.marks === null) {
    return `${hello}, ${v.studentName} was absent for ${test} on ${formatDate(v.testDate)}. – ${v.centreName}`;
  }
  return `${hello}, ${v.studentName} scored ${formatMarks(v.marks)}/${formatMarks(v.maxMarks)} (${percentOf(v.marks, v.maxMarks)}%) in ${test} on ${formatDate(v.testDate)}. – ${v.centreName}`;
}
