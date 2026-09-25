import type { SupabaseClient } from "@supabase/supabase-js";
import { isISODate } from "@/lib/calendar";
import { formatPhone } from "@/lib/phone";
import { PERIODS, periodRange, rangeLabel, summarizeAttendance, summarizeMarks, type PeriodPreset } from "@/lib/report";
import type { Centre, Database } from "@/types/database";

/** Reads ?period= (or ?from=&to=) into a safe date range. Falls back to "this month". */
export function resolvePeriod(params: Record<string, string | string[] | undefined>, today: string) {
  const get = (k: string) => (typeof params[k] === "string" ? (params[k] as string) : "");
  const from = get("from");
  const to = get("to");
  if (get("period") === "custom" && isISODate(from) && isISODate(to) && from <= to && to <= today) {
    return { preset: "custom" as const, from, to, label: rangeLabel(from, to) };
  }
  const preset = (PERIODS.find((p) => p.value === get("period"))?.value ?? "this-month") as PeriodPreset;
  return { preset, ...periodRange(preset, today) };
}

/** Everything a report card needs for one student and date range. RLS keeps it to the owner's centre. */
export async function loadReportData(
  supabase: SupabaseClient<Database>,
  centre: Centre,
  studentId: string,
  from: string,
  to: string,
) {
  const [{ data: student }, { data: attendance }, { data: marks }] = await Promise.all([
    supabase.from("students").select("*, batches(name)").eq("id", studentId).maybeSingle(),
    supabase.from("attendance").select("date, status").eq("student_id", studentId).gte("date", from).lte("date", to),
    supabase
      .from("test_marks")
      .select("marks, absent, tests!inner(name, subject, test_date, max_marks)")
      .eq("student_id", studentId)
      .gte("tests.test_date", from)
      .lte("tests.test_date", to),
  ]);
  if (!student) return null;

  return {
    centre: { name: centre.name, address: centre.address, phone: centre.phone ? formatPhone(centre.phone) : "" },
    student: {
      name: student.name,
      class: student.class,
      batch: student.batches?.name ?? "",
      parentName: student.parent_name,
      parentWhatsapp: student.parent_whatsapp,
      joiningDate: student.joining_date,
    },
    attendance: summarizeAttendance(attendance ?? [], from, to),
    marks: summarizeMarks(
      (marks ?? []).map((m) => ({ marks: m.marks, absent: m.absent, test: m.tests })),
      from,
      to,
    ),
  };
}
