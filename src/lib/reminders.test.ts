import { describe, expect, it } from "vitest";
import { groupOverdueByStudent } from "./reminders";

const base = {
  parent_name: "Rajesh",
  parent_whatsapp: "919876543210",
  batch_name: "Maths",
  father_name: "Rajesh",
  father_phone: "919876543210",
  mother_name: "Sunita",
  mother_phone: "919876543211",
  contact_parent: "both" as const,
};

describe("groupOverdueByStudent", () => {
  it("combines several unpaid months into one entry per student", () => {
    const groups = groupOverdueByStudent([
      { ...base, id: "f-aug", student_id: "s1", student_name: "Aarav", month: "2026-08-01", balance: 1200 },
      { ...base, id: "f-jul", student_id: "s1", student_name: "Aarav", month: "2026-07-01", balance: 500 },
      { ...base, id: "f-sep", student_id: "s2", student_name: "Diya", month: "2026-09-01", balance: 1500 },
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({
      studentName: "Aarav",
      months: ["2026-08-01", "2026-07-01"],
      total: 1700,
      latestFeeId: "f-aug", // newest month, even though it came first
    });
    expect(groups[1]).toMatchObject({ studentName: "Diya", total: 1500, latestFeeId: "f-sep" });
    expect(groups[0].recipients.map((r) => r.label)).toEqual(["Father", "Mother"]);
  });

  it("returns nothing when nobody is overdue", () => {
    expect(groupOverdueByStudent([])).toEqual([]);
  });
});
