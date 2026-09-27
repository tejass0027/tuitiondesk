import { addDays } from "@/lib/calendar";
import { formatDate } from "@/lib/format";

/** Longest break you can add in one go (e.g. summer holidays). */
export const MAX_HOLIDAY_DAYS = 62;

/** Every date from `from` to `to`, both included: ("2026-10-20", "2026-10-22") -> 3 dates. */
export function datesBetween(from: string, to: string): string[] {
  const dates: string[] = [];
  for (let d = from; d <= to && dates.length <= MAX_HOLIDAY_DAYS; d = addDays(d, 1)) dates.push(d);
  return dates;
}

export type HolidayRow = { id: string; date: string; name: string };
export type HolidayGroup = { from: string; to: string; name: string; ids: string[]; days: number };

/** Back-to-back days with the same name become one entry: "Diwali break · 20–24 Oct". */
export function groupHolidays(rows: HolidayRow[]): HolidayGroup[] {
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  const groups: HolidayGroup[] = [];
  for (const h of sorted) {
    const last = groups[groups.length - 1];
    if (last && last.name === h.name && addDays(last.to, 1) === h.date) {
      last.to = h.date;
      last.ids.push(h.id);
      last.days++;
    } else {
      groups.push({ from: h.date, to: h.date, name: h.name, ids: [h.id], days: 1 });
    }
  }
  return groups;
}

/** "20 Oct 2026" or "20 Oct – 24 Oct 2026" */
export function formatHolidayRange(from: string, to: string): string {
  if (from === to) return formatDate(from);
  const sameYear = from.slice(0, 4) === to.slice(0, 4);
  return `${sameYear ? formatDate(from).slice(0, -5) : formatDate(from)} – ${formatDate(to)}`;
}
