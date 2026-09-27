import { format, isValid, parse } from "date-fns";
import { parseAmount } from "@/lib/batches";
import { classLabel, cleanClassName } from "@/lib/classes";
import { normalizeIndianPhone } from "@/lib/phone";

/*
 * Turning a spreadsheet (Excel / CSV / pasted cells) into students.
 * Pure functions, so they're easy to test:
 *   rows of cells -> find which column is which -> one checked student per row.
 */

export type Cell = string | number | boolean | Date | null | undefined;

export type ImportField =
  | "name"
  | "class"
  | "batch"
  | "father_name"
  | "father_phone"
  | "mother_name"
  | "mother_phone"
  | "monthly_fee"
  | "joining_date";

/** Column headings we understand (after lower-casing and removing dots, brackets etc.). */
const HEADINGS: Record<ImportField, string[]> = {
  name: ["name", "student", "student name", "students name", "name of student", "full name"],
  class: ["class", "std", "standard", "grade", "class std"],
  batch: ["batch", "batch name", "timing", "group"],
  father_name: ["father", "father name", "fathers name", "parent", "parent name", "guardian", "guardian name"],
  father_phone: [
    "father phone", "father mobile", "father number", "father whatsapp", "fathers phone", "fathers mobile",
    "phone", "mobile", "mobile no", "phone no", "phone number", "mobile number", "whatsapp", "whatsapp number",
    "parent phone", "parent mobile", "parent whatsapp", "contact", "contact number",
  ],
  mother_name: ["mother", "mother name", "mothers name"],
  mother_phone: ["mother phone", "mother mobile", "mother number", "mother whatsapp", "mothers phone", "mothers mobile"],
  monthly_fee: ["fee", "fees", "monthly fee", "monthly fees", "fee per month", "amount"],
  joining_date: ["joining date", "joined", "joined on", "date of joining", "doj", "admission date", "start date"],
};

/** The columns in our downloadable template, in order. */
export const TEMPLATE_HEADINGS = [
  "Name",
  "Class",
  "Batch",
  "Father name",
  "Father phone",
  "Mother name",
  "Mother phone",
  "Monthly fee",
  "Joining date",
];

function normalizeHeading(h: Cell): string {
  return String(h ?? "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Which column holds which field, e.g. { name: 0, father_phone: 3 }. Unknown columns are ignored. */
export function matchColumns(headerRow: Cell[]): Partial<Record<ImportField, number>> {
  const found: Partial<Record<ImportField, number>> = {};
  headerRow.forEach((cell, index) => {
    const h = normalizeHeading(cell);
    const field = (Object.keys(HEADINGS) as ImportField[]).find((f) => HEADINGS[f].includes(h));
    if (field && found[field] === undefined) found[field] = index;
  });
  return found;
}

/** Plain text from CSV or cells pasted from Excel/Sheets -> rows of cells. Handles "quoted, values". */
export function parseDelimited(text: string): string[][] {
  const clean = text.replace(/^﻿/, "");
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? "";
  const sep = firstLine.includes("\t") ? "\t" : firstLine.includes(";") && !firstLine.includes(",") ? ";" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (quoted) {
      if (ch === '"' && clean[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell === "") quoted = true;
    else if (ch === sep) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && clean[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

const DATE_FORMATS = ["d/M/yyyy", "d-M-yyyy", "d.M.yyyy", "d/M/yy", "d-M-yy", "d MMM yyyy", "d-MMM-yyyy", "d MMMM yyyy"];

/** A date cell -> "yyyy-MM-dd", or null if we can't read it. Indian order (day first) for 05/06/2025. */
export function parseDateCell(cell: Cell): string | null {
  if (cell instanceof Date) return isValid(cell) ? format(cell, "yyyy-MM-dd") : null;
  if (typeof cell === "number") {
    // Excel stores dates as days since 1899-12-30
    if (cell < 20000 || cell > 80000) return null;
    const d = new Date(Date.UTC(1899, 11, 30) + Math.round(cell) * 86_400_000);
    return d.toISOString().slice(0, 10);
  }
  const s = String(cell ?? "").trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const d = parse(s.slice(0, 10), "yyyy-MM-dd", new Date());
    return isValid(d) ? s.slice(0, 10) : null;
  }
  for (const f of DATE_FORMATS) {
    const d = parse(s, f, new Date());
    if (isValid(d) && d.getFullYear() >= 1990 && d.getFullYear() <= 2100) return format(d, "yyyy-MM-dd");
  }
  return null;
}

function text(cell: Cell): string {
  if (cell === null || cell === undefined) return "";
  if (cell instanceof Date) return format(cell, "yyyy-MM-dd");
  return String(cell).replace(/\s+/g, " ").trim();
}

/** Excel often turns 9876543210 into the number 9876543210 (or 9.87654321E+09). */
function phoneText(cell: Cell): string {
  if (typeof cell === "number") return Math.round(cell).toString();
  return text(cell);
}

export type ImportStudent = {
  name: string;
  class: string;
  batch_id: string;
  father_name: string;
  father_phone: string | null;
  mother_name: string;
  mother_phone: string | null;
  contact_parent: "father" | "mother";
  monthly_fee: number;
  joining_date: string;
};

export type ImportRow = {
  /** Row number as the owner sees it in Excel (heading is row 1). */
  line: number;
  student: ImportStudent;
  batchName: string;
  problems: string[];
  /** Same name + phone already in the app. Skipped, not an error. */
  duplicate: boolean;
};

export type ImportBatch = { id: string; name: string; monthly_fee: number };

export type ImportResult =
  | { ok: false; message: string }
  | { ok: true; columns: ImportField[]; rows: ImportRow[] };

/** Key for spotting the same student twice: lower-case name + the phone digits. */
export function studentKey(name: string, phone: string | null): string {
  return `${name.trim().toLowerCase()}|${phone ?? ""}`;
}

/**
 * Checks every row of a sheet.
 * - The first row must be the headings. A "Name" column and at least one phone column are required.
 * - Missing batch -> the default batch. Missing fee -> that batch's fee. Missing date -> today.
 */
export function readStudentRows(
  sheet: Cell[][],
  opts: { batches: ImportBatch[]; defaultBatchId: string; today: string; existing?: Set<string> },
): ImportResult {
  const nonEmpty = sheet.filter((r) => r.some((c) => text(c) !== ""));
  if (nonEmpty.length === 0) return { ok: false, message: "This sheet is empty." };

  // Allow a title row or two above the headings
  const headerIndex = nonEmpty.slice(0, 5).findIndex((r) => matchColumns(r).name !== undefined);
  if (headerIndex === -1) {
    return { ok: false, message: "We couldn't find a “Name” column. The first row should have headings like Name, Class, Father phone." };
  }
  const cols = matchColumns(nonEmpty[headerIndex]);
  if (cols.father_phone === undefined && cols.mother_phone === undefined) {
    return { ok: false, message: "We couldn't find a phone column. Add a column called “Father phone” or “Mother phone”." };
  }

  const byName = new Map(opts.batches.map((b) => [b.name.trim().toLowerCase(), b]));
  const fallback = opts.batches.find((b) => b.id === opts.defaultBatchId);
  const seen = new Set<string>();
  const get = (row: Cell[], f: ImportField) => (cols[f] === undefined ? undefined : row[cols[f]!]);

  const rows = nonEmpty.slice(headerIndex + 1).map((row, i): ImportRow => {
    const problems: string[] = [];
    const name = text(get(row, "name"));
    if (name.length < 2) problems.push("Name is missing");
    if (name.length > 120) problems.push("Name is too long");

    const batchText = text(get(row, "batch"));
    const batch = batchText ? byName.get(batchText.toLowerCase()) : fallback;
    if (!batch) problems.push(batchText ? `No batch called “${batchText}”` : "Pick a batch for these students");

    const phoneOf = (f: "father_phone" | "mother_phone") => {
      const raw = phoneText(get(row, f));
      if (!raw) return null;
      const phone = normalizeIndianPhone(raw);
      if (!phone) problems.push(`${f === "father_phone" ? "Father" : "Mother"} phone “${raw}” isn't a valid mobile number`);
      return phone;
    };
    const father_phone = phoneOf("father_phone");
    const mother_phone = phoneOf("mother_phone");
    if (!father_phone && !mother_phone && !problems.some((p) => p.includes("phone"))) {
      problems.push("Add at least one parent's phone");
    }

    const feeCell = get(row, "monthly_fee");
    let monthly_fee = batch?.monthly_fee ?? 0;
    if (text(feeCell) !== "") {
      const fee = typeof feeCell === "number" ? feeCell : parseAmount(text(feeCell));
      if (!Number.isFinite(fee) || fee < 0 || fee > 10_00_000) problems.push(`Fee “${text(feeCell)}” doesn't look right`);
      else monthly_fee = fee;
    }

    const dateCell = get(row, "joining_date");
    let joining_date = opts.today;
    if (text(dateCell) !== "") {
      const d = parseDateCell(dateCell);
      if (!d) problems.push(`Can't read the date “${text(dateCell)}”. Use DD/MM/YYYY`);
      else joining_date = d;
    }

    const rawClass = cleanClassName(text(get(row, "class")));
    const student: ImportStudent = {
      name,
      class: rawClass ? classLabel(rawClass).slice(0, 40) : "",
      batch_id: batch?.id ?? "",
      father_name: text(get(row, "father_name")).slice(0, 120),
      father_phone,
      mother_name: text(get(row, "mother_name")).slice(0, 120),
      mother_phone,
      contact_parent: father_phone || !mother_phone ? "father" : "mother",
      monthly_fee,
      joining_date,
    };

    const key = studentKey(name, father_phone ?? mother_phone);
    const duplicate = Boolean(opts.existing?.has(key)) || seen.has(key);
    seen.add(key);

    return { line: headerIndex + i + 2, student, batchName: batch?.name ?? batchText, problems, duplicate };
  });

  if (rows.length === 0) return { ok: false, message: "We found the headings but no students under them." };
  return { ok: true, columns: Object.keys(cols) as ImportField[], rows };
}

/** The template as CSV text (opens in Excel), with one example row. */
export function templateCsv(batchName: string): string {
  const example = ["Aarav Sharma", "10", batchName, "Rajesh Sharma", "9876543210", "Sunita Sharma", "9876543211", "1500", format(new Date(), "dd/MM/yyyy")];
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return [TEMPLATE_HEADINGS, example].map((r) => r.map(esc).join(",")).join("\r\n") + "\r\n";
}
