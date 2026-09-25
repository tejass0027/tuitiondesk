import { describe, expect, it } from "vitest";
import { formatPhone, normalizeIndianPhone } from "./phone";

describe("normalizeIndianPhone", () => {
  it.each([
    ["9876543210", "919876543210"],
    ["98765 43210", "919876543210"],
    ["+91-98765-43210", "919876543210"],
    ["09876543210", "919876543210"],
    ["919876543210", "919876543210"],
  ])("accepts %s", (input, expected) => {
    expect(normalizeIndianPhone(input)).toBe(expected);
  });

  it.each(["", "12345", "1234567890", "abc"])("rejects %s", (input) => {
    expect(normalizeIndianPhone(input)).toBeNull();
  });
});

describe("formatPhone", () => {
  it("adds spacing for Indian numbers", () => {
    expect(formatPhone("919876543210")).toBe("+91 98765 43210");
  });
});
