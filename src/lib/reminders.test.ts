import { describe, expect, it } from "vitest";
import { toOverdueGroup } from "./reminders";

const row = {
  student_id: "s1",
  student_name: "Aarav",
  parent_name: "Rajesh",
  parent_whatsapp: "919876543210",
  batch_name: "Maths",
  father_name: "Rajesh",
  father_phone: "919876543210",
  mother_name: "Sunita",
  mother_phone: "919876543211",
  contact_parent: "both" as const,
  months: ["2026-07-01", "2026-08-01"],
  total: "1700.00",
  latest_fee_id: "f-aug",
};

describe("toOverdueGroup", () => {
  it("turns a database row into a reminder entry", () => {
    expect(toOverdueGroup(row)).toMatchObject({
      studentId: "s1",
      studentName: "Aarav",
      months: ["2026-07-01", "2026-08-01"],
      total: 1700,
      latestFeeId: "f-aug",
    });
  });

  it("messages the parent(s) chosen for the student", () => {
    expect(toOverdueGroup(row).recipients.map((r) => r.label)).toEqual(["Father", "Mother"]);
    expect(toOverdueGroup({ ...row, contact_parent: "mother" }).recipients.map((r) => r.label)).toEqual(["Mother"]);
  });
});
