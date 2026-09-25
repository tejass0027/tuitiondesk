"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCentre } from "@/lib/auth";
import { todayIST } from "@/lib/format";
import { isISODate } from "@/lib/calendar";
import type { ActionState } from "@/lib/action-state";

const saveSchema = z.object({
  batchId: z.uuid(),
  date: z.string().refine(isISODate, "Invalid date"),
  entries: z
    .array(z.object({ studentId: z.uuid(), status: z.enum(["present", "absent"]) }))
    .min(1, "No students to save"),
});

export type SaveAttendanceInput = z.infer<typeof saveSchema>;

/**
 * Saves a whole batch for one day in a single request.
 * "upsert" = insert new rows, or update the row if that student/batch/day
 * was already marked (the unique key in the database decides).
 */
export async function saveAttendance(input: SaveAttendanceInput): Promise<ActionState> {
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Something was wrong with that list. Please reload." };

  const { batchId, date, entries } = parsed.data;
  if (date > todayIST()) return { ok: false, message: "You can't mark attendance for a future date." };

  const { supabase } = await getCentre();
  const markedAt = new Date().toISOString();
  const { error } = await supabase.from("attendance").upsert(
    entries.map((e) => ({
      batch_id: batchId,
      student_id: e.studentId,
      date,
      status: e.status,
      marked_at: markedAt,
    })),
    // defaultToNull: false keeps database defaults (like centre_id) for columns we don't send
    { onConflict: "student_id,batch_id,date", defaultToNull: false },
  );

  if (error) return { ok: false, message: "Could not save attendance. Please try again." };

  revalidatePath("/", "layout");
  const absent = entries.filter((e) => e.status === "absent").length;
  return {
    ok: true,
    message: `Attendance saved · ${entries.length - absent} present, ${absent} absent`,
  };
}
