"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCentre } from "@/lib/auth";
import { type ActionState, invalid } from "@/lib/action-state";
import { parseAmount } from "@/lib/batches";
import { normalizeIndianPhone } from "@/lib/phone";
import { isOwnPhotoPath, PHOTO_BUCKET } from "@/lib/photos";

/** Optional phone: "" -> null, otherwise must be a valid number. */
const optionalPhone = z
  .string()
  .trim()
  .refine((v) => v === "" || normalizeIndianPhone(v) !== null, "Enter a valid 10-digit mobile number")
  .transform((v) => (v === "" ? null : normalizeIndianPhone(v)));

const studentSchema = z
  .object({
    name: z.string().trim().min(2, "Enter the student's name").max(120),
    class: z.string().trim().max(40),
    batch_id: z.uuid("Pick a batch"),
    father_name: z.string().trim().max(120),
    father_phone: optionalPhone,
    mother_name: z.string().trim().max(120),
    mother_phone: optionalPhone,
    contact_parent: z.enum(["father", "mother", "both"]),
    joining_date: z.iso.date("Pick the joining date"),
    monthly_fee: z
      .number("Enter the monthly fee")
      .min(0, "Fee can't be negative")
      .max(10_00_000, "That fee looks too large"),
  })
  // The parent who gets WhatsApp messages must have a phone number
  .refine(
    (s) =>
      s.contact_parent === "both"
        ? s.father_phone && s.mother_phone
        : s.contact_parent === "mother"
          ? s.mother_phone
          : s.father_phone,
    {
      path: ["contact_parent"],
      message: "Add a phone number for every parent who gets messages",
    },
  );

function parseStudent(formData: FormData) {
  return studentSchema.safeParse({
    name: formData.get("name"),
    class: formData.get("class") ?? "",
    batch_id: formData.get("batch_id"),
    father_name: formData.get("father_name") ?? "",
    father_phone: formData.get("father_phone") ?? "",
    mother_name: formData.get("mother_name") ?? "",
    mother_phone: formData.get("mother_phone") ?? "",
    contact_parent: formData.get("contact_parent") ?? "father",
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
  const { data: student } = await supabase.from("students").select("photo_path").eq("id", studentId).maybeSingle();
  const { error } = await supabase.from("students").delete().eq("id", studentId);
  if (error) return { ok: false, message: "Could not delete the student." };
  if (student?.photo_path) await supabase.storage.from(PHOTO_BUCKET).remove([student.photo_path]);

  refresh();
  return { ok: true, message: "Student deleted" };
}

/**
 * The browser has already uploaded the new photo to storage (see PhotoPicker);
 * this saves its path on the student and deletes the old photo.
 */
export async function setStudentPhoto(studentId: string, path: string): Promise<ActionState> {
  const { supabase, centre } = await getCentre();
  if (!isOwnPhotoPath(path, centre.id, studentId)) return { ok: false, message: "Could not save the photo." };

  const { data: student } = await supabase.from("students").select("photo_path").eq("id", studentId).maybeSingle();
  if (!student) return { ok: false, message: "Student not found." };

  const { error } = await supabase.from("students").update({ photo_path: path }).eq("id", studentId);
  if (error) return { ok: false, message: "Could not save the photo." };

  // Delete this student's older photos (and any half-finished uploads)
  const { data: files } = await supabase.storage.from(PHOTO_BUCKET).list(centre.id, { search: studentId });
  const old = (files ?? []).map((f) => `${centre.id}/${f.name}`).filter((p) => p !== path && p.includes(`/${studentId}-`));
  if (old.length) await supabase.storage.from(PHOTO_BUCKET).remove(old);

  refresh();
  return { ok: true, message: "Photo saved" };
}

export async function removeStudentPhoto(studentId: string): Promise<ActionState> {
  const { supabase } = await getCentre();
  const { data: student } = await supabase.from("students").select("photo_path").eq("id", studentId).maybeSingle();
  if (!student?.photo_path) return { ok: true, message: "Photo removed" };

  const { error } = await supabase.from("students").update({ photo_path: null }).eq("id", studentId);
  if (error) return { ok: false, message: "Could not remove the photo." };
  await supabase.storage.from(PHOTO_BUCKET).remove([student.photo_path]);

  refresh();
  return { ok: true, message: "Photo removed" };
}

/** Turns on the parent link: a long random token that is impossible to guess. */
export async function createParentLink(studentId: string): Promise<ActionState> {
  const token = randomBytes(24).toString("base64url"); // 32 characters
  const { supabase, centre } = await getCentre();
  if (!centre.parent_links_enabled) return { ok: false, message: "Turn on parent links in Settings first." };
  const { error } = await supabase.from("students").update({ share_token: token }).eq("id", studentId);
  if (error) return { ok: false, message: "Could not create the link." };

  revalidatePath(`/students/${studentId}`);
  return { ok: true, message: "Parent link is ready" };
}

/** Old links stop working straight away. */
export async function turnOffParentLink(studentId: string): Promise<ActionState> {
  const { supabase } = await getCentre();
  const { error } = await supabase.from("students").update({ share_token: null }).eq("id", studentId);
  if (error) return { ok: false, message: "Could not turn off the link." };

  revalidatePath(`/students/${studentId}`);
  return { ok: true, message: "Link turned off. The old link no longer works." };
}
