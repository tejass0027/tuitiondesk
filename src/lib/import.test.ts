import { describe, expect, it } from "vitest";
import { matchColumns, parseDateCell, parseDelimited, readStudentRows, studentKey, templateCsv } from "./import";

const batches = [
  { id: "b1", name: "Class 10 Maths", monthly_fee: 1200 },
  { id: "b2", name: "Evening", monthly_fee: 900 },
];
const opts = { batches, defaultBatchId: "b1", today: "2026-09-27" };

describe("matchColumns", () => {
  it("understands common headings", () => {
    expect(matchColumns(["Student Name", "Std.", "Father's Name", "Mobile No.", "Mother Phone", "Fees"])).toEqual({
      name: 0,
      class: 1,
      father_name: 2,
      father_phone: 3,
      mother_phone: 4,
      monthly_fee: 5,
    });
  });
});

describe("parseDelimited", () => {
  it("reads CSV with quotes", () => {
    expect(parseDelimited('Name,Fee\r\n"Sharma, Aarav",1500\r\n')).toEqual([
      ["Name", "Fee"],
      ["Sharma, Aarav", "1500"],
    ]);
  });
  it("reads cells pasted from Excel (tabs) and skips blank lines", () => {
    expect(parseDelimited("Name\tPhone\nDiya\t98765 43210\n\n")).toEqual([
      ["Name", "Phone"],
      ["Diya", "98765 43210"],
    ]);
  });
});

describe("parseDateCell", () => {
  it("reads Indian day-first dates", () => {
    expect(parseDateCell("05/06/2025")).toBe("2025-06-05");
    expect(parseDateCell("5-6-2025")).toBe("2025-06-05");
    expect(parseDateCell("15 Jun 2025")).toBe("2025-06-15");
    expect(parseDateCell("2025-06-15")).toBe("2025-06-15");
  });
  it("reads Excel date numbers", () => {
    expect(parseDateCell(45823)).toBe("2025-06-15");
  });
  it("rejects nonsense", () => {
    expect(parseDateCell("next week")).toBeNull();
    expect(parseDateCell("31/02/2025")).toBeNull();
  });
});

describe("readStudentRows", () => {
  it("fills in defaults and cleans values", () => {
    const res = readStudentRows(
      [
        ["Name", "Class", "Father name", "Father phone"],
        ["Aarav Sharma", "10", "Rajesh", 9876543210],
      ],
      opts,
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.rows[0]).toMatchObject({
      line: 2,
      batchName: "Class 10 Maths",
      problems: [],
      duplicate: false,
      student: {
        name: "Aarav Sharma",
        class: "Class 10",
        batch_id: "b1",
        father_phone: "919876543210",
        mother_phone: null,
        contact_parent: "father",
        monthly_fee: 1200,
        joining_date: "2026-09-27",
      },
    });
  });

  it("uses the batch column, its fee, and the mother when only she has a phone", () => {
    const res = readStudentRows(
      [
        ["Name", "Batch", "Mother phone"],
        ["Diya", "evening", "+91 98765 43211"],
      ],
      opts,
    );
    if (!res.ok) throw new Error(res.message);
    expect(res.rows[0].student).toMatchObject({ batch_id: "b2", monthly_fee: 900, contact_parent: "mother" });
  });

  it("lists problems per row", () => {
    const res = readStudentRows(
      [
        ["Name", "Batch", "Phone", "Fee", "Joining date"],
        ["R", "Morning", "12345", "abc", "someday"],
      ],
      opts,
    );
    if (!res.ok) throw new Error(res.message);
    expect(res.rows[0].problems).toEqual([
      "Name is missing",
      "No batch called “Morning”",
      "Father phone “12345” isn't a valid mobile number",
      "Fee “abc” doesn't look right",
      "Can't read the date “someday”. Use DD/MM/YYYY",
    ]);
  });

  it("marks students already added, and repeats inside the sheet", () => {
    const existing = new Set([studentKey("Aarav Sharma", "919876543210")]);
    const res = readStudentRows(
      [
        ["Name", "Phone"],
        ["aarav sharma", "9876543210"],
        ["Diya", "9876543211"],
        ["Diya", "9876543211"],
      ],
      { ...opts, existing },
    );
    if (!res.ok) throw new Error(res.message);
    expect(res.rows.map((r) => r.duplicate)).toEqual([true, false, true]);
  });

  it("finds headings under a title row", () => {
    const res = readStudentRows([["Sharma Classes 2026"], ["Name", "Phone"], ["Diya", "9876543211"]], opts);
    if (!res.ok) throw new Error(res.message);
    expect(res.rows[0].line).toBe(3);
  });

  it("explains a sheet without the needed columns", () => {
    expect(readStudentRows([["Roll", "Marks"]], opts)).toMatchObject({ ok: false });
    expect(readStudentRows([["Name"], ["Diya"]], opts)).toMatchObject({ ok: false });
  });
});

describe("templateCsv", () => {
  it("round-trips through our own reader", () => {
    const res = readStudentRows(parseDelimited(templateCsv("Evening")), opts);
    if (!res.ok) throw new Error(res.message);
    expect(res.rows[0].problems).toEqual([]);
    expect(res.rows[0].student.batch_id).toBe("b2");
  });
});
