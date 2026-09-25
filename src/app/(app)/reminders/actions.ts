"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCentre } from "@/lib/auth";
import type { ActionState } from "@/lib/action-state";

const logSchema = z.object({
  studentId: z.uuid(),
  type: z.enum(["fee", "absence", "custom"]),
  message: z.string().trim().min(1).max(2000),
  feeRecordId: z.uuid().nullish(),
});

export type LogReminderInput = z.infer<typeof logSchema>;

/**
 * Called when the owner taps "Open WhatsApp". We can't know if they really
 * pressed Send inside WhatsApp, so this records "reminder opened".
 */
export async function logReminder(input: LogReminderInput): Promise<ActionState> {
  const parsed = logSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Could not log this reminder." };

  const { studentId, type, message, feeRecordId } = parsed.data;
  const { supabase } = await getCentre();
  const { error } = await supabase.from("reminder_logs").insert({
    student_id: studentId,
    type,
    message,
    fee_record_id: feeRecordId ?? null,
  });
  if (error) return { ok: false, message: "Could not log this reminder." };

  revalidatePath("/reminders");
  revalidatePath("/fees");
  return { ok: true };
}
