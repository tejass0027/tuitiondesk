"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCentre } from "@/lib/auth";
import { type ActionState, invalid } from "@/lib/action-state";
import { parseAmount } from "@/lib/batches";
import { isISODate } from "@/lib/calendar";
import { todayIST } from "@/lib/format";
import { formatMarks } from "@/lib/marks";

const testSchema = z.object({
  batch_id: z.uuid("Pick a batch"),
  name: z.string().trim().min(2, "Give the test a name").max(120),
  subject: z.string().trim().max(60),
  test_date: z
    .string()
    .refine(isISODate, "Pick the test date")
    .refine((d) => d <= todayIST(), "Test date can't be in the future"),
  max_marks: z
    .number("Enter the maximum marks")
    .positive("Maximum marks must be more than 0")
    .max(1000, "That looks too large"),
});

function parseTest(formData: FormData) {
  return testSchema.safeParse({
    batch_id: formData.get("batch_id"),
    name: formData.get("name"),
    subject: formData.get("subject") ?? "",
    test_date: formData.get("test_date"),
    max_marks: parseAmount(formData.get("max_marks")),
  });
}

export async function createTest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseTest(formData);
  if (!parsed.success) return invalid(parsed.error, formData);

  const { supabase } = await getCentre();
  const { data, error } = await supabase.from("tests").insert(parsed.data).select("id").single();
  if (error) return { ok: false, message: "Could not create the test. Please try again." };

  revalidatePath("/tests");
  return { ok: true, message: "Test created. Now enter the marks.", id: data.id };
}

export async function updateTest(testId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseTest(formData);
  if (!parsed.success) return invalid(parsed.error, formData);

  const { supabase } = await getCentre();
  const { error } = await supabase.from("tests").update(parsed.data).eq("id", testId);
  if (error) {
    // the database refuses a new maximum that is lower than marks already entered
    const tooLow = error.code === "23514" || /maximum/i.test(error.message);
    return {
      ok: false,
      message: tooLow
        ? "Some students already have more marks than this maximum. Fix their marks first."
        : "Could not save the test. Please try again.",
    };
  }

  revalidatePath("/tests", "layout");
  revalidatePath("/students", "layout");
  return { ok: true, message: "Test updated", id: testId };
}

export async function deleteTest(testId: string): Promise<ActionState> {
  const { supabase } = await getCentre();
  const { error } = await supabase.from("tests").delete().eq("id", testId);
  if (error) return { ok: false, message: "Could not delete the test." };

  revalidatePath("/tests", "layout");
  revalidatePath("/students", "layout");
  return { ok: true, message: "Test deleted" };
}

const saveMarksSchema = z.object({
  testId: z.uuid(),
  entries: z
    .array(
      z.object({
        studentId: z.uuid(),
        marks: z.number().min(0).nullable(),
        absent: z.boolean(),
      }),
    )
    .min(1, "Enter marks for at least one student"),
});

export type SaveMarksInput = z.infer<typeof saveMarksSchema>;

/**
 * Saves the whole marks sheet in one request (upsert on test + student),
 * so typing marks again later simply updates them.
 * Students left blank are skipped, not saved as zero.
 */
export async function saveMarks(input: SaveMarksInput): Promise<ActionState> {
  const parsed = saveMarksSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Some marks look wrong. Please check and try again." };

  const { testId, entries } = parsed.data;
  const { supabase } = await getCentre();

  const { data: test } = await supabase.from("tests").select("id, max_marks").eq("id", testId).maybeSingle();
  if (!test) return { ok: false, message: "This test could not be found. Please reload." };

  const over = entries.find((e) => e.marks !== null && e.marks > Number(test.max_marks));
  if (over) {
    return { ok: false, message: `Marks can't be more than ${formatMarks(test.max_marks)}.` };
  }

  const rows = entries
    .filter((e) => e.absent || e.marks !== null)
    .map((e) => ({
      test_id: testId,
      student_id: e.studentId,
      marks: e.absent ? null : e.marks,
      absent: e.absent,
      updated_at: new Date().toISOString(),
    }));
  if (rows.length === 0) return { ok: false, message: "Type at least one student's marks first." };

  const { error } = await supabase
    .from("test_marks")
    .upsert(rows, { onConflict: "test_id,student_id", defaultToNull: false });
  if (error) return { ok: false, message: "Could not save marks. Please try again." };

  // A student cleared back to blank: remove their old saved marks
  const cleared = entries.filter((e) => !e.absent && e.marks === null).map((e) => e.studentId);
  if (cleared.length) {
    await supabase.from("test_marks").delete().eq("test_id", testId).in("student_id", cleared);
  }

  revalidatePath("/tests", "layout");
  revalidatePath("/students", "layout");
  return { ok: true, message: `Marks saved for ${rows.length} ${rows.length === 1 ? "student" : "students"}` };
}
