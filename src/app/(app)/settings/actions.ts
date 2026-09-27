"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCentre } from "@/lib/auth";
import { type ActionState, invalid } from "@/lib/action-state";
import { normalizeIndianPhone } from "@/lib/phone";

const centreSchema = z.object({
  name: z.string().trim().min(2, "Enter your centre's name").max(120),
  phone: z
    .string()
    .trim()
    .transform((v) => normalizeIndianPhone(v))
    .refine((v) => v !== null, "Enter a valid 10-digit mobile number"),
  address: z.string().trim().max(300).default(""),
  fee_due_day: z.coerce
    .number("Pick a day")
    .int()
    .min(1, "Pick a day between 1 and 28")
    .max(28, "Pick a day between 1 and 28"),
});

export async function updateCentre(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = centreSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error, formData);

  const { supabase, centre } = await getCentre();
  const { error } = await supabase
    .from("centres")
    .update({ ...parsed.data, phone: parsed.data.phone! })
    .eq("id", centre.id);

  if (error) return { ok: false, message: "Could not save. Please try again." };

  revalidatePath("/", "layout");
  return { ok: true, message: "Centre details saved" };
}

/** The parent-link feature switch. Off = every parent link stops working (they come back when switched on). */
export async function setParentLinks(enabled: boolean): Promise<ActionState> {
  const { supabase, centre } = await getCentre();
  const { error } = await supabase.from("centres").update({ parent_links_enabled: enabled }).eq("id", centre.id);
  if (error) return { ok: false, message: "Could not change the setting." };

  revalidatePath("/", "layout");
  return {
    ok: true,
    message: enabled ? "Parent links are on" : "Parent links are off. Links already sent won't open.",
  };
}
