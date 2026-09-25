import { describe, expect, it } from "vitest";
import { isPartlyPaid, paymentModeLabel, summarizeFees } from "./fees";

describe("summarizeFees", () => {
  it("adds up collected and pending", () => {
    const rows = [
      { amount_due: 1500, amount_paid: 1500, balance: 0 },
      { amount_due: 1200, amount_paid: 500, balance: 700 },
      { amount_due: 1000, amount_paid: 0, balance: 1000 },
    ];
    expect(summarizeFees(rows)).toEqual({ expected: 3700, collected: 2000, pending: 1700, percent: 54 });
  });

  it("handles an empty month", () => {
    expect(summarizeFees([])).toEqual({ expected: 0, collected: 0, pending: 0, percent: 0 });
  });
});

describe("isPartlyPaid", () => {
  it("is true only when something but not everything is paid", () => {
    expect(isPartlyPaid({ amount_paid: 500, balance: 700 })).toBe(true);
    expect(isPartlyPaid({ amount_paid: 0, balance: 700 })).toBe(false);
    expect(isPartlyPaid({ amount_paid: 1200, balance: 0 })).toBe(false);
  });
});

describe("paymentModeLabel", () => {
  it("returns friendly labels", () => {
    expect(paymentModeLabel("bank_transfer")).toBe("Bank transfer");
    expect(paymentModeLabel("upi")).toBe("UPI");
  });
});
