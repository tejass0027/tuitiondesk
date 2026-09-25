import { formatDate, formatINR, formatMonth } from "@/lib/format";

/**
 * WhatsApp "click to chat" link. Opens WhatsApp with the message already
 * typed, so the owner only taps Send. No paid API needed.
 * phone must be digits with country code, e.g. "919876543210".
 */
export function whatsappLink(phone: string, message: string): string {
  const text = message.trim();
  return `https://wa.me/${phone}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** "Namaste Rajesh ji," style greeting; falls back to plain "Namaste" if no parent name. */
function greeting(parentName: string) {
  const name = parentName.trim();
  return name ? `Namaste ${name}` : "Namaste";
}

/** "August and September 2026", "July, August and September 2026", or "September 2026" */
export function formatMonthList(months: string[]): string {
  const sorted = [...new Set(months)].sort();
  const labels = sorted.map((m) => formatMonth(m));
  if (labels.length <= 1) return labels[0] ?? "";
  // "August 2026 and September 2026" -> drop the repeated year when all months share it
  const sameYear = sorted.every((m) => m.slice(0, 4) === sorted[0].slice(0, 4));
  const parts = sameYear ? labels.map((l, i) => (i < labels.length - 1 ? l.replace(/ \d{4}$/, "") : l)) : labels;
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

export function feeReminderMessage(v: {
  parentName: string;
  studentName: string;
  amount: number;
  months: string[]; // "yyyy-MM-01"
  centreName: string;
}): string {
  return `${greeting(v.parentName)}, this is a reminder that ${v.studentName}'s fee of ${formatINR(v.amount)} for ${formatMonthList(v.months)} is due. – ${v.centreName}`;
}

export function absenceMessage(v: {
  parentName: string;
  studentName: string;
  date: string; // "yyyy-MM-dd"
  batchName: string;
  centreName: string;
  /** "yyyy-MM-dd"; when the absence was on an earlier day we say "on <date>" instead of "today" */
  today?: string;
}): string {
  const when = !v.today || v.date === v.today ? `today (${formatDate(v.date)})` : `on ${formatDate(v.date)}`;
  return `${greeting(v.parentName)}, ${v.studentName} was absent ${when} for ${v.batchName}. – ${v.centreName}`;
}

/** Starting text for a free-form message; the owner types the rest. */
export function customMessageStart(v: { parentName: string; centreName: string }): string {
  return `${greeting(v.parentName)}, \n\n– ${v.centreName}`;
}
