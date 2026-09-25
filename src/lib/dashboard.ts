import { addMonths } from "@/lib/calendar";
import { summarizeFees } from "@/lib/fees";

type FeeRow = { month: string; amount_due: number; amount_paid: number; balance: number };

export type MonthPoint = {
  month: string; // "yyyy-MM"
  label: string; // "Sep"
  collected: number;
  pending: number;
};

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** The last `count` months ending at `endMonth` ("yyyy-MM"), oldest first. */
export function lastMonths(endMonth: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => addMonths(endMonth, i - count + 1));
}

/** Collected vs pending per month, including months with no fees (as zeros). */
export function feeSeries(rows: FeeRow[], months: string[]): MonthPoint[] {
  return months.map((m) => {
    const { collected, pending } = summarizeFees(rows.filter((r) => r.month.startsWith(m)));
    return { month: m, label: SHORT_MONTHS[Number(m.slice(5, 7)) - 1], collected, pending };
  });
}

type AttendanceStat = {
  student_id: string;
  student_name: string;
  recent_total: number;
  recent_present: number;
};

/** Students whose attendance over the last 30 days is below the threshold, worst first. */
export function lowAttendance(stats: AttendanceStat[], threshold = 75) {
  return stats
    .filter((s) => s.recent_total > 0)
    .map((s) => ({ ...s, percent: Math.round((s.recent_present / s.recent_total) * 100) }))
    .filter((s) => s.percent < threshold)
    .sort((a, b) => a.percent - b.percent || a.student_name.localeCompare(b.student_name));
}

/** "₹12K", "₹1.2L", "₹0" for chart axes (Indian short form). */
export function formatINRShort(value: number): string {
  if (value >= 1_00_00_000) return `₹${trim(value / 1_00_00_000)}Cr`;
  if (value >= 1_00_000) return `₹${trim(value / 1_00_000)}L`;
  if (value >= 1_000) return `₹${trim(value / 1_000)}K`;
  return `₹${value}`;
}

function trim(n: number) {
  return n >= 10 ? String(Math.round(n)) : String(Math.round(n * 10) / 10);
}
