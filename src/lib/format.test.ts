import { describe, expect, it } from "vitest";
import { formatDate, formatINR, formatMonth, formatTime, monthStart, todayIST } from "./format";

describe("formatINR", () => {
  it("uses Indian digit grouping", () => {
    expect(formatINR(100000)).toBe("₹1,00,000");
    expect(formatINR(1234567)).toBe("₹12,34,567");
  });
  it("shows paise only when there are some", () => {
    expect(formatINR(1500)).toBe("₹1,500");
    expect(formatINR(1500.5)).toBe("₹1,500.5");
  });
  it("treats missing values as zero", () => {
    expect(formatINR(null)).toBe("₹0");
    expect(formatINR("abc")).toBe("₹0");
  });
});

describe("dates", () => {
  it("formats as DD MMM YYYY", () => {
    expect(formatDate("2026-09-05")).toBe("05 Sep 2026");
  });
  it("formats months", () => {
    expect(formatMonth("2026-09-01")).toBe("September 2026");
    expect(monthStart("2026-09-25")).toBe("2026-09-01");
  });
  it("formats 24h time as 12h", () => {
    expect(formatTime("17:30:00")).toBe("5:30 PM");
    expect(formatTime("00:05")).toBe("12:05 AM");
    expect(formatTime(null)).toBe("");
  });
  it("uses the Indian date even when UTC is still on the previous day", () => {
    // 20:00 UTC on 24 Sep = 01:30 IST on 25 Sep
    expect(todayIST(new Date("2026-09-24T20:00:00Z"))).toBe("2026-09-25");
  });
});
