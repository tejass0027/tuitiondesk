import { describe, expect, it } from "vitest";
import { performanceLabel, periodRange, summarizeAttendance, summarizeMarks } from "./report";

describe("periodRange", () => {
  it("covers this month up to today", () => {
    expect(periodRange("this-month", "2026-09-25")).toEqual({
      from: "2026-09-01",
      to: "2026-09-25",
      label: "September 2026",
    });
  });
  it("covers the last 3 months including this one", () => {
    expect(periodRange("last-3-months", "2026-01-10").from).toBe("2025-11-01");
  });
  it("uses the April–March academic year", () => {
    expect(periodRange("session", "2026-09-25")).toMatchObject({ from: "2026-04-01", label: "Academic year 2026–27" });
    expect(periodRange("session", "2027-02-10")).toMatchObject({ from: "2026-04-01", label: "Academic year 2026–27" });
  });
});

describe("summarizeAttendance", () => {
  it("counts days in range and splits by month", () => {
    const rows = [
      { date: "2026-08-03", status: "present" as const },
      { date: "2026-08-05", status: "absent" as const },
      { date: "2026-09-02", status: "present" as const },
      { date: "2026-09-04", status: "present" as const },
      { date: "2026-07-30", status: "absent" as const }, // outside range
    ];
    const s = summarizeAttendance(rows, "2026-08-01", "2026-09-25");
    expect(s).toMatchObject({ total: 4, present: 3, absent: 1, percent: 75 });
    expect(s.byMonth.map((m) => [m.label, m.present, m.total, m.percent])).toEqual([
      ["August 2026", 1, 2, 50],
      ["September 2026", 2, 2, 100],
    ]);
  });
  it("returns no percentage when nothing was marked", () => {
    expect(summarizeAttendance([], "2026-09-01", "2026-09-25").percent).toBeNull();
  });
});

describe("summarizeMarks", () => {
  const test = (name: string, subject: string, date: string, max = 50) => ({
    name,
    subject,
    test_date: date,
    max_marks: max,
  });

  it("builds rows, overall average and subject averages", () => {
    const s = summarizeMarks(
      [
        { marks: 45, absent: false, test: test("Unit 1", "Maths", "2026-09-10") },
        { marks: 30, absent: false, test: test("Unit 2", "Maths", "2026-09-20") },
        { marks: 80, absent: false, test: test("Chapter test", "Science", "2026-09-15", 100) },
        { marks: null, absent: true, test: test("Unit 3", "Maths", "2026-09-22") },
      ],
      "2026-09-01",
      "2026-09-30",
    );
    expect(s.tests.map((t) => t.name)).toEqual(["Unit 1", "Chapter test", "Unit 2", "Unit 3"]);
    expect(s.tests[0]).toMatchObject({ percent: 90, label: "Excellent" });
    expect(s.tests[3]).toMatchObject({ absent: true, label: "Absent" });
    expect(s).toMatchObject({ written: 3, missed: 1, average: 77, averageLabel: "Very good" });
    expect(s.bySubject).toEqual([
      { subject: "Science", tests: 1, average: 80, label: "Very good" },
      { subject: "Maths", tests: 2, average: 75, label: "Very good" },
    ]);
  });
});

describe("performanceLabel", () => {
  it("maps percentages to words", () => {
    expect(performanceLabel(95)).toBe("Excellent");
    expect(performanceLabel(60)).toBe("Good");
    expect(performanceLabel(39)).toBe("Needs improvement");
  });
});
