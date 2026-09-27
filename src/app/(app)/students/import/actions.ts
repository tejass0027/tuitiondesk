"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCentre } from "@/lib/auth";
import { compareClassNames } from "@/lib/classes";
import type { ActionState } from "@/lib/action-state";
import { type ImportStudent, studentKey } from "@/lib/import";

const phone = z.string().regex(/^[0-9]{10,15}$/).nullable();

// The browser already checked each row; we check again because anyone can call a Server Action.
const rowsSchema = z
  .array(
    z
      .object({
        name: z.string().trim().min(2).max(120),
        class: z.string().trim().max(40),
        batch_id: z.uuid(),
        father_name: z.string().trim().max(120),
        father_phone: phone,
        mother_name: z.string().trim().max(120),
        mother_phone: phone,
        contact_parent: z.enum(["father", "mother"]),
        monthly_fee: z.number().min(0).max(10_00_000),
        joining_date: z.iso.date(),
      })
      .refine((s) => (s.contact_parent === "mother" ? s.mother_phone : s.father_phone)),
  )
  .min(1)
  .max(500);

/** Adds many students in one go (from an Excel / CSV sheet). */
export async function importStudents(rows: ImportStudent[]): Promise<ActionState> {
  const parsed = rowsSchema.safeParse(rows);
  if (!parsed.success) return { ok: false, message: "Some rows have problems. Please fix them and try again." };

  const { supabase } = await getCentre();

  // Skip anyone already in the app (e.g. the same sheet uploaded twice)
  const { data: existing } = await supabase.from("students").select("name, father_phone, mother_phone, parent_whatsapp");
  const known = new Set(
    (existing ?? []).flatMap((s) =>
      [s.father_phone, s.mother_phone, s.parent_whatsapp].filter(Boolean).map((p) => studentKey(s.name, p)),
    ),
  );
  const fresh = parsed.data.filter((s) => !known.has(studentKey(s.name, s.father_phone ?? s.mother_phone)));
  if (fresh.length === 0) return { ok: true, message: "Everyone in this sheet is already added.", id: "0" };

  const { error } = await supabase.from("students").insert(fresh);
  if (error) {
    return {
      ok: false,
      message:
        error.code === "23503"
          ? "One of the batches no longer exists. Refresh the page and try again."
          : "Could not add the students. Nothing was saved, please try again.",
    };
  }

  // New class names from the sheet join the class list, so filters show them
  const { data: classes } = await supabase.from("classes").select("name, sort_order");
  const have = new Set((classes ?? []).map((c) => c.name.toLowerCase()));
  const newNames = [
    ...new Map(fresh.filter((s) => s.class && !have.has(s.class.toLowerCase())).map((s) => [s.class.toLowerCase(), s.class])).values(),
  ];
  if (newNames.length) {
    const start = Math.max(0, ...(classes ?? []).map((c) => c.sort_order)) + 1;
    await supabase
      .from("classes")
      .insert(newNames.sort(compareClassNames).map((name, i) => ({ name, sort_order: start + i })));
  }

  revalidatePath("/students", "layout");
  revalidatePath("/batches", "layout");
  revalidatePath("/classes");
  revalidatePath("/fees");
  const skipped = parsed.data.length - fresh.length;
  return {
    ok: true,
    message: `${fresh.length} ${fresh.length === 1 ? "student" : "students"} added${skipped ? ` (${skipped} already there, skipped)` : ""}`,
    id: String(fresh.length),
  };
}
