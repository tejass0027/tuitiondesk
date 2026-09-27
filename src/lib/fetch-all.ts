/**
 * Supabase returns at most 1000 rows per request. For the few places that
 * really need every row (e.g. "Remind all overdue", spotting repeats during
 * an import) this asks for them 1000 at a time until there are no more.
 * The query must have a stable order, so pages don't overlap.
 */
export async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
  pageSize = 1000,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await page(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) return rows;
  }
}

/**
 * `.in("id", ids)` puts every id in the URL, which gets too long past a few
 * hundred. This runs the lookup for 100 ids at a time (in parallel) and joins the results.
 */
export async function inChunks<T>(
  ids: string[],
  lookup: (chunk: string[]) => PromiseLike<{ data: T[] | null; error: unknown }>,
  chunkSize = 100,
): Promise<T[]> {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += chunkSize) chunks.push(ids.slice(i, i + chunkSize));
  const results = await Promise.all(chunks.map((c) => lookup(c)));
  return results.flatMap((r) => {
    if (r.error) throw r.error;
    return r.data ?? [];
  });
}
