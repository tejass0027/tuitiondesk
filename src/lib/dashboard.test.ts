import { describe, expect, it } from "vitest";
import { feeSeries, formatINRShort, lastMonths } from "./dashboard";

describe("lastMonths", () => {
  it("lists months oldest first, across a year change", () => {
    expect(lastMonths("2026-02", 4)).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
  });
});

describe("feeSeries", () => {
  it("uses each month's totals and fills gaps with zero", () => {
    const totals = [
      { month: "2026-09-01", collected: 2000, pending: "700.00" },
      { month: "2026-07-01", collected: 0, pending: 1000 },
    ];
    expect(feeSeries(totals, ["2026-07", "2026-08", "2026-09"])).toEqual([
      { month: "2026-07", label: "Jul", collected: 0, pending: 1000 },
      { month: "2026-08", label: "Aug", collected: 0, pending: 0 },
      { month: "2026-09", label: "Sep", collected: 2000, pending: 700 },
    ]);
  });
});

describe("formatINRShort", () => {
  it("uses K, L and Cr", () => {
    expect(formatINRShort(0)).toBe("₹0");
    expect(formatINRShort(1500)).toBe("₹1.5K");
    expect(formatINRShort(45000)).toBe("₹45K");
    expect(formatINRShort(120000)).toBe("₹1.2L");
    expect(formatINRShort(25000000)).toBe("₹2.5Cr");
  });
});
