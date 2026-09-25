import { formatTime } from "@/lib/format";

export const WEEK_DAYS = [
  { key: "mon", short: "Mon", label: "Monday" },
  { key: "tue", short: "Tue", label: "Tuesday" },
  { key: "wed", short: "Wed", label: "Wednesday" },
  { key: "thu", short: "Thu", label: "Thursday" },
  { key: "fri", short: "Fri", label: "Friday" },
  { key: "sat", short: "Sat", label: "Saturday" },
  { key: "sun", short: "Sun", label: "Sunday" },
] as const;

export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type DayKey = (typeof DAY_KEYS)[number];

/** ["mon","tue","wed","thu","fri","sat"] -> "Mon – Sat"; ["mon","wed","fri"] -> "Mon, Wed, Fri" */
export function formatDays(days: string[]): string {
  const idx = DAY_KEYS.map((k, i) => (days.includes(k) ? i : -1)).filter((i) => i >= 0);
  if (idx.length === 0) return "No days set";
  if (idx.length === 7) return "Every day";
  const isRun = idx.length >= 3 && idx.every((v, i) => i === 0 || v === idx[i - 1] + 1);
  if (isRun) return `${WEEK_DAYS[idx[0]].short} – ${WEEK_DAYS[idx[idx.length - 1]].short}`;
  return idx.map((i) => WEEK_DAYS[i].short).join(", ");
}

/** "5:00 PM – 6:30 PM", or "" when no time is set */
export function formatTimeRange(start: string | null, end: string | null): string {
  if (!start) return "";
  return end ? `${formatTime(start)} – ${formatTime(end)}` : formatTime(start);
}

/** Day key ("mon"...) for a "yyyy-MM-dd" date. */
export function dayKeyOf(isoDate: string): DayKey {
  const [y, m, d] = isoDate.split("-").map(Number);
  const jsDay = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sunday
  return DAY_KEYS[(jsDay + 6) % 7];
}

/** "1,500" / "₹1500" / " 1500.50 " -> 1500 / 1500 / 1500.5 */
export function parseAmount(input: unknown): number {
  if (typeof input !== "string") return Number.NaN;
  const cleaned = input.replace(/[₹,\s]/g, "");
  return cleaned === "" ? Number.NaN : Number(cleaned);
}
