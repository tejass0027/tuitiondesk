"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCentre } from "@/lib/auth";
import { type ActionState, formValues, invalid } from "@/lib/action-state";
import { parseAmount } from "@/lib/batches";
import { isISODate } from "@/lib/calendar";
import { formatINR, todayIST } from "@/lib/format";

const paymentSchema = z.object({
  amount: z.number("Enter the amount received").positive("Amount must be more than ₹0"),
  paid_on: z.string().refine(isISODate, "Pick the payment date"),
  mode: z.enum(["cash", "upi", "bank_transfer"], "Choose how it was paid"),
  note: z.string().trim().max(200).default(""),
});

/**
 * Records money received against one month's fee.
 * Paying less than the balance is fine (partial payment); paying more is not.
 */
export async function recordPayment(
  feeRecordId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = paymentSchema.safeParse({
    amount: parseAmount(formData.get("amount")),
    paid_on: formData.get("paid_on"),
    mode: formData.get("mode"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) return invalid(parsed.error, formData);

  const { supabase } = await getCentre();
  const { data: fee } = await supabase
    .from("fee_overview")
    .select("id, balance, student_name")
    .eq("id", feeRecordId)
    .maybeSingle();
  if (!fee) return { ok: false, message: "This fee could not be found. Please reload." };

  const { amount, paid_on } = parsed.data;
  const fieldError = (field: string, message: string): ActionState => ({
    ok: false,
    message,
    fieldErrors: { [field]: [message] },
    values: formValues(formData),
  });
  if (amount > Number(fee.balance)) {
    return fieldError("amount", `That's more than the balance of ${formatINR(fee.balance)}`);
  }
  if (paid_on > todayIST()) return fieldError("paid_on", "Payment date can't be in the future");

  const { data, error } = await supabase
    .from("payments")
    .insert({ fee_record_id: feeRecordId, ...parsed.data })
    .select("id")
    .single();
  if (error) return { ok: false, message: "Could not save the payment. Please try again." };

  revalidatePath("/", "layout");
  const remaining = Number(fee.balance) - amount;
  return {
    ok: true,
    id: data.id,
    message:
      remaining > 0
        ? `${formatINR(amount)} received from ${fee.student_name}. ${formatINR(remaining)} still due.`
        : `${fee.student_name}'s fee is fully paid`,
  };
}

/** Removes a payment entered by mistake (used by the "Undo" button). */
export async function deletePayment(paymentId: string): Promise<ActionState> {
  const { supabase } = await getCentre();
  const { error } = await supabase.from("payments").delete().eq("id", paymentId);
  if (error) return { ok: false, message: "Could not undo the payment." };

  revalidatePath("/", "layout");
  return { ok: true, message: "Payment removed" };
}
