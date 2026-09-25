import { describe, expect, it } from "vitest";
import { formatMarks, parseMarksInput, percentOf, resultMessage, scoreBand, summarizeMarks } from "./marks";

describe("formatMarks / percentOf", () => {
  it("drops trailing zeros and rounds percentages", () => {
    expect(formatMarks("45.00")).toBe("45");
    expect(formatMarks(42.5)).toBe("42.5");
    expect(formatMarks(null)).toBe("–");
    expect(percentOf(42.5, 50)).toBe(85);
    expect(percentOf(1, 3)).toBe(33);
  });
});

describe("parseMarksInput", () => {
  it("accepts whole and decimal marks", () => {
    expect(parseMarksInput("45")).toBe(45);
    expect(parseMarksInput(" 42.5 ")).toBe(42.5);
    expect(parseMarksInput("42,5")).toBe(42.5);
    expect(parseMarksInput("")).toBeNull();
  });
  it("rejects junk and negatives", () => {
    expect(parseMarksInput("abc")).toBeNaN();
    expect(parseMarksInput("-3")).toBeNaN();
    expect(parseMarksInput("4.555")).toBeNaN();
  });
});

describe("summarizeMarks", () => {
  it("ignores absent students in the average", () => {
    expect(
      summarizeMarks(
        [
          { marks: 40, absent: false },
          { marks: 30, absent: false },
          { marks: null, absent: true },
        ],
        50,
      ),
    ).toEqual({ written: 2, absent: 1, averagePercent: 70, highest: 40, lowest: 30 });
  });
  it("handles a test nobody has written yet", () => {
    expect(summarizeMarks([], 50).averagePercent).toBeNull();
  });
});

describe("scoreBand", () => {
  it("groups percentages", () => {
    expect(scoreBand(80)).toBe("good");
    expect(scoreBand(75)).toBe("good");
    expect(scoreBand(50)).toBe("average");
    expect(scoreBand(39)).toBe("low");
  });
});

describe("resultMessage", () => {
  const base = {
    parentName: "Rajesh",
    studentName: "Aarav",
    testName: "Unit Test 1",
    subject: "Maths",
    testDate: "2026-09-25",
    maxMarks: 50,
    centreName: "Sharma Classes",
  };
  it("shares the score", () => {
    expect(resultMessage({ ...base, marks: 42.5, absent: false })).toBe(
      "Namaste Rajesh, Aarav scored 42.5/50 (85%) in Unit Test 1 (Maths) on 25 Sep 2026. – Sharma Classes",
    );
  });
  it("says when the student missed the test", () => {
    expect(resultMessage({ ...base, subject: "", marks: null, absent: true })).toBe(
      "Namaste Rajesh, Aarav was absent for Unit Test 1 on 25 Sep 2026. – Sharma Classes",
    );
  });
});
