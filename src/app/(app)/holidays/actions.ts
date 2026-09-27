"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCentre } from "@/lib/auth";
import { type ActionState, invalid } from "@/lib/action-state";
import { datesBetween, MAX_HOLIDAY_DAYS } from "@/lib/holidays";

const holidaySchema = z
  .object({
    from: z.iso.date("Pick the date"),
    to: z.union([z.iso.date(), z.literal("")]),
    name: z.string().trim().min(1, "Give it a name, like “Diwali”").max(80),
  })
  .transform((v) => ({ ...v, to: v.to || v.from }))
  .refine((v) => v.to >= v.from, { path: ["to"], message: "The last day can't be before the first day" })
  .refine((v) => datesBetween(v.from, v.to).length <= MAX_HOLIDAY_DAYS, {
    path: ["to"],
    message: `Add at most ${MAX_HOLIDAY_DAYS} days at a time`,
  });

function refresh() {
  revalidatePath("/holidays");
  revalidatePath("/attendance");
  revalidatePath("/");
  revalidatePath("/students", "layout");
}

/** Adds one day, or every day in a range (a "Diwali break"). Re-adding a day just renames it. */
export async function addHolidays(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = holidaySchema.safeParse({
    from: formData.get("from"),
    to: formData.get("to") ?? "",
    name: formData.get("name") ?? "",
  });
  if (!parsed.success) return invalid(parsed.error, formData);

  const { from, to, name } = parsed.data;
  const { supabase, centre } = await getCentre();
  const { error } = await supabase
    .from("holidays")
    .upsert(
      datesBetween(from, to).map((date) => ({ centre_id: centre.id, date, name })),
      { onConflict: "centre_id,date" },
    );
  if (error) return { ok: false, message: "Could not save the holiday. Please try again." };

  refresh();
  const days = datesBetween(from, to).length;
  return { ok: true, message: days === 1 ? `${name} added` : `${name} added (${days} days)` };
}

export async function deleteHolidays(ids: string[]): Promise<ActionState> {
  const parsed = z.array(z.uuid()).min(1).max(100).safeParse(ids);
  if (!parsed.success) return { ok: false, message: "Could not remove the holiday." };

  const { supabase } = await getCentre();
  const { error } = await supabase.from("holidays").delete().in("id", parsed.data);
  if (error) return { ok: false, message: "Could not remove the holiday." };

  refresh();
  return { ok: true, message: "Holiday removed" };
}
