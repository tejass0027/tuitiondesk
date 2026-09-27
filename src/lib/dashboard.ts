import { addMonths } from "@/lib/calendar";

/** One month's fee totals, as the database's fee_month_totals() returns them. */
type MonthTotals = { month: string; collected: number | string; pending: number | string };

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

/** Collected vs pending per month for the chart, with months that have no fees as zeros. */
export function feeSeries(totals: MonthTotals[], months: string[]): MonthPoint[] {
  return months.map((m) => {
    const t = totals.find((r) => r.month.startsWith(m));
    return {
      month: m,
      label: SHORT_MONTHS[Number(m.slice(5, 7)) - 1],
      collected: Number(t?.collected ?? 0),
      pending: Number(t?.pending ?? 0),
    };
  });
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
