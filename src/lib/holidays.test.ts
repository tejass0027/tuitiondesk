import { describe, expect, it } from "vitest";
import { datesBetween, formatHolidayRange, groupHolidays } from "./holidays";

describe("datesBetween", () => {
  it("includes both ends and crosses months", () => {
    expect(datesBetween("2026-10-30", "2026-11-02")).toEqual(["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02"]);
    expect(datesBetween("2026-10-05", "2026-10-05")).toEqual(["2026-10-05"]);
    expect(datesBetween("2026-10-05", "2026-10-01")).toEqual([]);
  });
});

describe("groupHolidays", () => {
  it("joins back-to-back days with the same name", () => {
    const groups = groupHolidays([
      { id: "c", date: "2026-10-22", name: "Diwali" },
      { id: "a", date: "2026-10-20", name: "Diwali" },
      { id: "b", date: "2026-10-21", name: "Diwali" },
      { id: "d", date: "2026-10-23", name: "Exam" },
      { id: "e", date: "2026-10-25", name: "Exam" },
    ]);
    expect(groups).toEqual([
      { from: "2026-10-20", to: "2026-10-22", name: "Diwali", ids: ["a", "b", "c"], days: 3 },
      { from: "2026-10-23", to: "2026-10-23", name: "Exam", ids: ["d"], days: 1 },
      { from: "2026-10-25", to: "2026-10-25", name: "Exam", ids: ["e"], days: 1 },
    ]);
  });
});

describe("formatHolidayRange", () => {
  it("shortens ranges in the same year", () => {
    expect(formatHolidayRange("2026-10-20", "2026-10-20")).toBe("20 Oct 2026");
    expect(formatHolidayRange("2026-10-20", "2026-10-24")).toBe("20 Oct – 24 Oct 2026");
    expect(formatHolidayRange("2026-12-30", "2027-01-02")).toBe("30 Dec 2026 – 02 Jan 2027");
  });
});
