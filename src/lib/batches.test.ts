import { describe, expect, it } from "vitest";
import { dayKeyOf, formatDays, formatTimeRange, parseAmount } from "./batches";

describe("formatDays", () => {
  it("shortens a run of days", () => {
    expect(formatDays(["mon", "tue", "wed", "thu", "fri", "sat"])).toBe("Mon – Sat");
  });
  it("lists separate days in week order", () => {
    expect(formatDays(["fri", "mon", "wed"])).toBe("Mon, Wed, Fri");
  });
  it("handles every day and no days", () => {
    expect(formatDays(["mon", "tue", "wed", "thu", "fri", "sat", "sun"])).toBe("Every day");
    expect(formatDays([])).toBe("No days set");
  });
});

describe("formatTimeRange", () => {
  it("formats start and end", () => {
    expect(formatTimeRange("17:00:00", "18:30:00")).toBe("5:00 PM – 6:30 PM");
    expect(formatTimeRange(null, null)).toBe("");
  });
});

describe("dayKeyOf", () => {
  it("finds the weekday", () => {
    expect(dayKeyOf("2026-09-25")).toBe("fri");
    expect(dayKeyOf("2026-09-27")).toBe("sun");
  });
});

describe("parseAmount", () => {
  it("accepts commas and the rupee sign", () => {
    expect(parseAmount("1,500")).toBe(1500);
    expect(parseAmount("₹ 1,00,000")).toBe(100000);
    expect(parseAmount("1500.50")).toBe(1500.5);
  });
  it("returns NaN for empty or junk", () => {
    expect(parseAmount("")).toBeNaN();
    expect(parseAmount("abc")).toBeNaN();
  });
});
