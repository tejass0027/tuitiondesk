import { formatINR } from "@/lib/format";

/*
 * Small helpers for the fee receipt PDF.
 */

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function belowHundred(n: number): string {
  if (n < 20) return ONES[n];
  return [TENS[Math.floor(n / 10)], ONES[n % 10]].filter(Boolean).join(" ");
}

function belowThousand(n: number): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  return [hundreds ? `${ONES[hundreds]} Hundred` : "", rest ? belowHundred(rest) : ""].filter(Boolean).join(" ");
}

/** Whole number in the Indian system: 150000 -> "One Lakh Fifty Thousand". */
export function numberInWords(n: number): string {
  n = Math.floor(Math.abs(n));
  if (n === 0) return "Zero";
  const crore = Math.floor(n / 1_00_00_000);
  const lakh = Math.floor((n % 1_00_00_000) / 1_00_000);
  const thousand = Math.floor((n % 1_00_000) / 1000);
  const rest = n % 1000;
  return [
    crore ? `${numberInWords(crore)} Crore` : "",
    lakh ? `${belowHundred(lakh)} Lakh` : "",
    thousand ? `${belowHundred(thousand)} Thousand` : "",
    rest ? belowThousand(rest) : "",
  ]
    .filter(Boolean)
    .join(" ");
}

/** 1500.5 -> "Rupees One Thousand Five Hundred and Fifty Paise Only" */
export function amountInWords(amount: number): string {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  return `Rupees ${numberInWords(rupees)}${paise ? ` and ${numberInWords(paise)} Paise` : ""} Only`;
}

/** Short, readable receipt number from the payment date and id: "TD-260927-3F9A2C". */
export function receiptNumber(paymentId: string, paidOn: string): string {
  return `TD-${paidOn.slice(2, 4)}${paidOn.slice(5, 7)}${paidOn.slice(8, 10)}-${paymentId.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

/** The PDF's built-in font has no ₹ sign, so receipts say "Rs. 1,500". */
export function rupees(amount: number | string): string {
  return formatINR(amount).replace("₹", "Rs. ");
}

type PaymentLine = { id: string; amount: number | string; paid_on: string; created_at: string };

/** How much of the month's fee was paid up to and including this payment (older ones first). */
export function paidUpTo(payments: PaymentLine[], paymentId: string): number {
  const sorted = [...payments].sort((a, b) =>
    a.paid_on === b.paid_on ? a.created_at.localeCompare(b.created_at) : a.paid_on.localeCompare(b.paid_on),
  );
  let total = 0;
  for (const p of sorted) {
    total += Number(p.amount);
    if (p.id === paymentId) break;
  }
  return total;
}
