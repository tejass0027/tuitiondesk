import { format, parseISO } from "date-fns";

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

/** 100000 -> "₹1,00,000" (Indian grouping, paise only when needed) */
export function formatINR(amount: number | string | null | undefined): string {
  const value = Number(amount ?? 0);
  return inrFormatter.format(Number.isFinite(value) ? value : 0);
}

/** Accepts "2026-09-25", an ISO timestamp, or a Date. */
function toDate(value: string | Date): Date {
  return typeof value === "string" ? parseISO(value) : value;
}

/** "25 Sep 2026" */
export function formatDate(value: string | Date): string {
  return format(toDate(value), "dd MMM yyyy");
}

/** "25 Sep 2026, 4:30 PM" */
export function formatDateTime(value: string | Date): string {
  return format(toDate(value), "dd MMM yyyy, h:mm a");
}

/** "September 2026" */
export function formatMonth(value: string | Date): string {
  return format(toDate(value), "MMMM yyyy");
}

/** "17:30:00" -> "5:30 PM" */
export function formatTime(time: string | null | undefined): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** Today's date in India as "yyyy-MM-dd", regardless of the server's timezone. */
export function todayIST(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** First day of the month for a "yyyy-MM-dd" date -> "yyyy-MM-01" */
export function monthStart(isoDate: string): string {
  return `${isoDate.slice(0, 7)}-01`;
}
