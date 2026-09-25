import { describe, expect, it } from "vitest";
import { addDays, addMonths, isISODate, isISOMonth, monthEnd, monthGrid } from "./calendar";

describe("addDays / addMonths / monthEnd", () => {
  it("crosses month and year boundaries", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
  });
  it("knows month lengths, including leap years", () => {
    expect(monthEnd("2026-02")).toBe("2026-02-28");
    expect(monthEnd("2028-02")).toBe("2028-02-29");
    expect(monthEnd("2026-09")).toBe("2026-09-30");
  });
});

describe("monthGrid", () => {
  it("starts weeks on Monday", () => {
    // 1 Sep 2026 is a Tuesday
    const weeks = monthGrid("2026-09");
    expect(weeks[0]).toEqual([null, "2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04", "2026-09-05", "2026-09-06"]);
    expect(weeks.flat().filter(Boolean)).toHaveLength(30);
    expect(weeks.every((w) => w.length === 7)).toBe(true);
  });
});

describe("validators", () => {
  it("accepts real dates and months only", () => {
    expect(isISODate("2026-09-25")).toBe(true);
    expect(isISODate("2026-02-30")).toBe(false);
    expect(isISODate("25-09-2026")).toBe(false);
    expect(isISOMonth("2026-09")).toBe(true);
    expect(isISOMonth("2026-13")).toBe(false);
  });
});
