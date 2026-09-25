/** Date helpers that work on plain "yyyy-MM-dd" strings (no timezone surprises). */

function toUTC(isoDate: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function toISO(date: Date) {
  return date.toISOString().slice(0, 10);
}

/** addDays("2026-09-30", 1) -> "2026-10-01" */
export function addDays(isoDate: string, days: number): string {
  const d = toUTC(isoDate);
  d.setUTCDate(d.getUTCDate() + days);
  return toISO(d);
}

/** addMonths("2026-01", 1) -> "2026-02" (works on "yyyy-MM") */
export function addMonths(month: string, months: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + months, 1));
  return toISO(d).slice(0, 7);
}

/** Last day of a "yyyy-MM" month as "yyyy-MM-dd" */
export function monthEnd(month: string): string {
  return addDays(`${addMonths(month, 1)}-01`, -1);
}

/**
 * Weeks for a month calendar, Monday first. Days outside the month are null.
 * monthGrid("2026-09") -> [[null, "2026-09-01", ...], ...]
 */
export function monthGrid(month: string): (string | null)[][] {
  const first = `${month}-01`;
  const last = monthEnd(month);
  const leading = (toUTC(first).getUTCDay() + 6) % 7; // Mon=0 ... Sun=6

  const cells: (string | null)[] = Array.from({ length: leading }, () => null);
  for (let d = first; d <= last; d = addDays(d, 1)) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** Is this a real "yyyy-MM-dd" date? */
export function isISODate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && toISO(toUTC(value)) === value;
}

/** Is this a real "yyyy-MM" month? */
export function isISOMonth(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}
