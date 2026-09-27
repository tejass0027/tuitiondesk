import { describe, expect, it } from "vitest";
import { fetchAll, inChunks } from "./fetch-all";

describe("fetchAll", () => {
  const source = Array.from({ length: 2345 }, (_, i) => i);
  const page = async (from: number, to: number) => ({ data: source.slice(from, to + 1), error: null });

  it("keeps asking until a page comes back short", async () => {
    expect(await fetchAll(page)).toEqual(source);
    expect((await fetchAll(page, 1000)).length).toBe(2345);
  });

  it("handles an exact multiple of the page size", async () => {
    const exact = Array.from({ length: 2000 }, (_, i) => i);
    expect(await fetchAll(async (f, t) => ({ data: exact.slice(f, t + 1), error: null }))).toHaveLength(2000);
  });

  it("stops on an error", async () => {
    await expect(fetchAll(async () => ({ data: null, error: new Error("boom") }))).rejects.toThrow("boom");
  });
});

describe("inChunks", () => {
  it("looks up ids 100 at a time and joins the results", async () => {
    const ids = Array.from({ length: 250 }, (_, i) => `id${i}`);
    const sizes: number[] = [];
    const rows = await inChunks(ids, async (chunk) => {
      sizes.push(chunk.length);
      return { data: chunk.map((id) => ({ id })), error: null };
    });
    expect(sizes).toEqual([100, 100, 50]);
    expect(rows.map((r) => r.id)).toEqual(ids);
  });

  it("does nothing for an empty list", async () => {
    expect(await inChunks([], async () => ({ data: [1], error: null }))).toEqual([]);
  });
});
