/**
 * Turns what an owner types ("98765 43210", "+91-98765-43210", "098765...")
 * into the digits-only format WhatsApp links need: "919876543210".
 * Returns null if it doesn't look like a valid number.
 */
export function normalizeIndianPhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) {
    return /^[6-9]/.test(digits) ? `91${digits}` : null;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return /^91[6-9]/.test(digits) ? digits : null;
  }
  // Numbers from other countries: accept if they include a country code
  if (digits.length >= 11 && digits.length <= 15 && !digits.startsWith("0")) {
    return digits;
  }
  return null;
}

/** "919876543210" -> "+91 98765 43210" */
export function formatPhone(digits: string): string {
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return `+${digits}`;
}
