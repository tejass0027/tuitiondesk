"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCentre } from "@/lib/auth";
import { type ActionState, invalid } from "@/lib/action-state";
import { DAY_KEYS, parseAmount } from "@/lib/batches";

const batchSchema = z
  .object({
    name: z.string().trim().min(2, "Give the batch a name").max(120),
    days: z.array(z.enum(DAY_KEYS)).min(1, "Pick at least one day"),
    start_time: z.string().trim(),
    end_time: z.string().trim(),
    monthly_fee: z
      .number("Enter the monthly fee")
      .min(0, "Fee can't be negative")
      .max(10_00_000, "That fee looks too large"),
  })
  .refine((b) => !b.end_time || !b.start_time || b.end_time > b.start_time, {
    path: ["end_time"],
    message: "End time should be after the start time",
  });

function parseBatch(formData: FormData) {
  return batchSchema.safeParse({
    name: formData.get("name"),
    days: formData.getAll("days"),
    start_time: formData.get("start_time") ?? "",
    end_time: formData.get("end_time") ?? "",
    monthly_fee: parseAmount(formData.get("monthly_fee")),
  });
}

function toRow(data: z.infer<typeof batchSchema>) {
  return {
    name: data.name,
    days: data.days,
    start_time: data.start_time || null,
    end_time: data.end_time || null,
    monthly_fee: data.monthly_fee,
  };
}

export async function createBatch(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseBatch(formData);
  if (!parsed.success) return invalid(parsed.error, formData);

  const { supabase } = await getCentre();
  // centre_id is filled in by the database default (my_centre_id())
  const { data, error } = await supabase.from("batches").insert(toRow(parsed.data)).select("id").single();
  if (error) return { ok: false, message: "Could not save the batch. Please try again." };

  revalidatePath("/batches", "layout");
  return { ok: true, message: `Batch "${parsed.data.name}" created`, id: data.id };
}

export async function updateBatch(
  batchId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseBatch(formData);
  if (!parsed.success) return invalid(parsed.error, formData);

  const { supabase } = await getCentre();
  const { error } = await supabase.from("batches").update(toRow(parsed.data)).eq("id", batchId);
  if (error) return { ok: false, message: "Could not save the batch. Please try again." };

  revalidatePath("/batches", "layout");
  return { ok: true, message: "Batch updated", id: batchId };
}

export async function setBatchActive(batchId: string, isActive: boolean): Promise<ActionState> {
  const { supabase } = await getCentre();
  const { error } = await supabase.from("batches").update({ is_active: isActive }).eq("id", batchId);
  if (error) return { ok: false, message: "Could not update the batch." };

  revalidatePath("/batches", "layout");
  return { ok: true, message: isActive ? "Batch is active again" : "Batch archived" };
}

export async function deleteBatch(batchId: string): Promise<ActionState> {
  const { supabase } = await getCentre();
  const { error } = await supabase.from("batches").delete().eq("id", batchId);

  if (error) {
    // 23503 = foreign key violation: students are still in this batch
    return {
      ok: false,
      message:
        error.code === "23503"
          ? "This batch still has students. Move them to another batch, or archive it instead."
          : "Could not delete the batch.",
    };
  }

  revalidatePath("/batches", "layout");
  return { ok: true, message: "Batch deleted" };
}
