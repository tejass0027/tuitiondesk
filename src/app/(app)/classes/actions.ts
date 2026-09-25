"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCentre } from "@/lib/auth";
import type { ActionState } from "@/lib/action-state";
import { CLASS_PRESETS, cleanClassName, missingNames } from "@/lib/classes";

const nameSchema = z
  .string()
  .transform(cleanClassName)
  .pipe(z.string().min(1, "Type a class name").max(40, "Keep it under 40 letters"));

function refresh() {
  revalidatePath("/classes");
  revalidatePath("/students", "layout");
  revalidatePath("/fees");
}

/** Next sort position, so new classes go to the end of the list. */
async function nextOrder(supabase: Awaited<ReturnType<typeof getCentre>>["supabase"]) {
  const { data } = await supabase.from("classes").select("sort_order").order("sort_order", { ascending: false }).limit(1);
  return (data?.[0]?.sort_order ?? 0) + 1;
}

export async function addClass(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = nameSchema.safeParse(formData.get("name") ?? "");
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message, fieldErrors: { name: [parsed.error.issues[0].message] } };
  }

  const { supabase } = await getCentre();
  const { error } = await supabase.from("classes").insert({ name: parsed.data, sort_order: await nextOrder(supabase) });
  if (error) {
    return {
      ok: false,
      message: error.code === "23505" ? `"${parsed.data}" is already in your list` : "Could not add the class.",
      values: { name: parsed.data },
    };
  }

  refresh();
  return { ok: true, message: `${parsed.data} added` };
}

export async function addPreset(presetKey: string): Promise<ActionState> {
  const preset = CLASS_PRESETS.find((p) => p.key === presetKey);
  if (!preset) return { ok: false, message: "Unknown list." };

  const { supabase } = await getCentre();
  const { data: existing } = await supabase.from("classes").select("name");
  const toAdd = missingNames((existing ?? []).map((c) => c.name), preset.names);
  if (toAdd.length === 0) return { ok: true, message: `All of ${preset.label} are already in your list` };

  const start = await nextOrder(supabase);
  const { error } = await supabase
    .from("classes")
    .insert(toAdd.map((name, i) => ({ name, sort_order: start + i })));
  if (error) return { ok: false, message: "Could not add these classes." };

  refresh();
  return { ok: true, message: `Added ${toAdd.length} ${toAdd.length === 1 ? "class" : "classes"}` };
}

export async function renameClass(classId: string, newName: string): Promise<ActionState> {
  const parsed = nameSchema.safeParse(newName);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  const { supabase } = await getCentre();
  // Renames the class and updates every student who was in it
  const { error } = await supabase.rpc("rename_class", { p_class_id: classId, p_new_name: parsed.data });
  if (error) {
    return {
      ok: false,
      message: error.code === "23505" ? `"${parsed.data}" is already in your list` : "Could not rename the class.",
    };
  }

  refresh();
  return { ok: true, message: `Renamed to ${parsed.data}` };
}

export async function deleteClass(classId: string): Promise<ActionState> {
  const { supabase } = await getCentre();
  const { error } = await supabase.from("classes").delete().eq("id", classId);
  if (error) return { ok: false, message: "Could not delete the class." };

  refresh();
  return { ok: true, message: "Class removed from the list" };
}
