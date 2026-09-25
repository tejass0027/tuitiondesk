import { describe, expect, it } from "vitest";
import { feeSeries, formatINRShort, lastMonths, lowAttendance } from "./dashboard";

describe("lastMonths", () => {
  it("lists months oldest first, across a year change", () => {
    expect(lastMonths("2026-02", 4)).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
  });
});

describe("feeSeries", () => {
  it("adds up each month and fills gaps with zero", () => {
    const rows = [
      { month: "2026-09-01", amount_due: 1200, amount_paid: 500, balance: 700 },
      { month: "2026-09-01", amount_due: 1500, amount_paid: 1500, balance: 0 },
      { month: "2026-07-01", amount_due: 1000, amount_paid: 0, balance: 1000 },
    ];
    expect(feeSeries(rows, ["2026-07", "2026-08", "2026-09"])).toEqual([
      { month: "2026-07", label: "Jul", collected: 0, pending: 1000 },
      { month: "2026-08", label: "Aug", collected: 0, pending: 0 },
      { month: "2026-09", label: "Sep", collected: 2000, pending: 700 },
    ]);
  });
});

describe("lowAttendance", () => {
  it("keeps students under 75% who have marked days, worst first", () => {
    const result = lowAttendance([
      { student_id: "a", student_name: "Asha", recent_total: 10, recent_present: 9 }, // 90%
      { student_id: "b", student_name: "Bala", recent_total: 10, recent_present: 5 }, // 50%
      { student_id: "c", student_name: "Chetan", recent_total: 4, recent_present: 2 }, // 50%
      { student_id: "d", student_name: "Divya", recent_total: 0, recent_present: 0 }, // not marked
      { student_id: "e", student_name: "Esha", recent_total: 8, recent_present: 6 }, // exactly 75%
    ]);
    expect(result.map((r) => [r.student_name, r.percent])).toEqual([
      ["Bala", 50],
      ["Chetan", 50],
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
