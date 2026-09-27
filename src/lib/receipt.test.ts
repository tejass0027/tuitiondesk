import { describe, expect, it } from "vitest";
import { amountInWords, numberInWords, paidUpTo, receiptNumber, rupees } from "./receipt";

describe("numberInWords", () => {
  it("uses the Indian system", () => {
    expect(numberInWords(0)).toBe("Zero");
    expect(numberInWords(15)).toBe("Fifteen");
    expect(numberInWords(700)).toBe("Seven Hundred");
    expect(numberInWords(1500)).toBe("One Thousand Five Hundred");
    expect(numberInWords(42_500)).toBe("Forty Two Thousand Five Hundred");
    expect(numberInWords(1_50_000)).toBe("One Lakh Fifty Thousand");
    expect(numberInWords(2_03_00_021)).toBe("Two Crore Three Lakh Twenty One");
  });
});

describe("amountInWords", () => {
  it("adds rupees, paise and 'Only'", () => {
    expect(amountInWords(1500)).toBe("Rupees One Thousand Five Hundred Only");
    expect(amountInWords(99.5)).toBe("Rupees Ninety Nine and Fifty Paise Only");
  });
});

describe("receiptNumber", () => {
  it("is short and based on the date + id", () => {
    expect(receiptNumber("3f9a2c11-aaaa-bbbb-cccc-000000000000", "2026-09-27")).toBe("TD-260927-3F9A2C");
  });
});

describe("rupees", () => {
  it("writes Rs. instead of the ₹ sign", () => {
    expect(rupees(1500)).toBe("Rs. 1,500");
    expect(rupees("150000")).toBe("Rs. 1,50,000");
  });
});

describe("paidUpTo", () => {
  const payments = [
    { id: "b", amount: 300, paid_on: "2026-09-10", created_at: "2026-09-10T10:00:00Z" },
    { id: "a", amount: 500, paid_on: "2026-09-05", created_at: "2026-09-05T10:00:00Z" },
    { id: "c", amount: 200, paid_on: "2026-09-10", created_at: "2026-09-10T12:00:00Z" },
  ];
  it("adds payments up to this one, oldest first", () => {
    expect(paidUpTo(payments, "a")).toBe(500);
    expect(paidUpTo(payments, "b")).toBe(800);
    expect(paidUpTo(payments, "c")).toBe(1000);
  });
});
