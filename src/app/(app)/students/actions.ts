"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCentre } from "@/lib/auth";
import { type ActionState, invalid } from "@/lib/action-state";
import { parseAmount } from "@/lib/batches";
import { normalizeIndianPhone } from "@/lib/phone";

const studentSchema = z.object({
  name: z.string().trim().min(2, "Enter the student's name").max(120),
  class: z.string().trim().max(40),
  batch_id: z.uuid("Pick a batch"),
  parent_name: z.string().trim().max(120),
  parent_whatsapp: z
    .string()
    .trim()
    .transform((v) => normalizeIndianPhone(v))
    .refine((v): v is string => v !== null, "Enter a valid 10-digit WhatsApp number"),
  joining_date: z.iso.date("Pick the joining date"),
  monthly_fee: z
    .number("Enter the monthly fee")
    .min(0, "Fee can't be negative")
    .max(10_00_000, "That fee looks too large"),
});

function parseStudent(formData: FormData) {
  return studentSchema.safeParse({
    name: formData.get("name"),
    class: formData.get("class") ?? "",
    batch_id: formData.get("batch_id"),
    parent_name: formData.get("parent_name") ?? "",
    parent_whatsapp: formData.get("parent_whatsapp") ?? "",
    joining_date: formData.get("joining_date"),
    monthly_fee: parseAmount(formData.get("monthly_fee")),
  });
}

function refresh() {
  revalidatePath("/students", "layout");
  revalidatePath("/batches", "layout"); // student counts
}

export async function createStudent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseStudent(formData);
  if (!parsed.success) return invalid(parsed.error, formData);

  const { supabase } = await getCentre();
  const { data, error } = await supabase.from("students").insert(parsed.data).select("id").single();
  if (error) return { ok: false, message: "Could not save the student. Please try again." };

  refresh();
  return { ok: true, message: `${parsed.data.name} added`, id: data.id };
}

export async function updateStudent(
  studentId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseStudent(formData);
  if (!parsed.success) return invalid(parsed.error, formData);

  const { supabase } = await getCentre();
  const { error } = await supabase.from("students").update(parsed.data).eq("id", studentId);
  if (error) return { ok: false, message: "Could not save the student. Please try again." };

  refresh();
  return { ok: true, message: "Student updated", id: studentId };
}

export async function setStudentActive(studentId: string, isActive: boolean): Promise<ActionState> {
  const { supabase } = await getCentre();
  const { error } = await supabase.from("students").update({ is_active: isActive }).eq("id", studentId);
  if (error) return { ok: false, message: "Could not update the student." };

  refresh();
  return {
    ok: true,
    message: isActive ? "Student is active again" : "Marked as left. No new fees will be added.",
  };
}

export async function deleteStudent(studentId: string): Promise<ActionState> {
  const { supabase } = await getCentre();
  const { error } = await supabase.from("students").delete().eq("id", studentId);
  if (error) return { ok: false, message: "Could not delete the student." };

  refresh();
  return { ok: true, message: "Student deleted" };
}
