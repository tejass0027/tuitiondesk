import type { PaymentMode } from "@/types/database";

export const PAYMENT_MODES: { value: PaymentMode; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank transfer" },
];

export function paymentModeLabel(mode: PaymentMode): string {
  return PAYMENT_MODES.find((m) => m.value === mode)?.label ?? mode;
}

type FeeRow = { amount_due: number; amount_paid: number; balance: number };

/** Collected vs pending for a list of fee records, plus % collected (0-100). */
export function summarizeFees(rows: FeeRow[]) {
  const expected = rows.reduce((sum, r) => sum + Number(r.amount_due), 0);
  const collected = rows.reduce((sum, r) => sum + Math.min(Number(r.amount_paid), Number(r.amount_due)), 0);
  const pending = rows.reduce((sum, r) => sum + Number(r.balance), 0);
  const percent = expected > 0 ? Math.round((collected / expected) * 100) : 0;
  return { expected, collected, pending, percent };
}

/** Fee is partly paid: something received, but not all of it. */
export function isPartlyPaid(row: { amount_paid: number; balance: number }) {
  return Number(row.amount_paid) > 0 && Number(row.balance) > 0;
}
