/** Long lists load 50 rows at a time; "Show more" adds the next 50. */
export const PAGE_SIZE = 50;
const MAX_SHOWN = 2000;

/** ?show=150 -> 150 (rounded to whole pages, never below one page or above 2000). */
export function pageSize(param: unknown): number {
  const n = Math.ceil(Number(param) / PAGE_SIZE) * PAGE_SIZE;
  return Number.isFinite(n) ? Math.min(Math.max(n, PAGE_SIZE), MAX_SHOWN) : PAGE_SIZE;
}
