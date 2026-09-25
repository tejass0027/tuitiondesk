import { describe, expect, it } from "vitest";
import { absenceMessage, feeReminderMessage, formatMonthList, whatsappLink } from "./whatsapp";

describe("whatsappLink", () => {
  it("encodes the message into a wa.me link", () => {
    expect(whatsappLink("919876543210", "Fee ₹1,500 due & pending")).toBe(
      "https://wa.me/919876543210?text=Fee%20%E2%82%B91%2C500%20due%20%26%20pending",
    );
  });
  it("leaves out ?text when there is no message", () => {
    expect(whatsappLink("919876543210", "  ")).toBe("https://wa.me/919876543210");
  });
});

describe("feeReminderMessage", () => {
  it("fills the fee template", () => {
    expect(
      feeReminderMessage({
        parentName: "Rajesh",
        studentName: "Aarav",
        amount: 1500,
        months: ["2026-09-01"],
        centreName: "Sharma Classes",
      }),
    ).toBe(
      "Namaste Rajesh, this is a reminder that Aarav's fee of ₹1,500 for September 2026 is due. – Sharma Classes",
    );
  });
  it("combines several months and handles a missing parent name", () => {
    expect(
      feeReminderMessage({
        parentName: "",
        studentName: "Aarav",
        amount: 3000,
        months: ["2026-09-01", "2026-08-01"],
        centreName: "Sharma Classes",
      }),
    ).toBe(
      "Namaste, this is a reminder that Aarav's fee of ₹3,000 for August and September 2026 is due. – Sharma Classes",
    );
  });
});

describe("absenceMessage", () => {
  it("fills the absence template", () => {
    expect(
      absenceMessage({
        parentName: "Rajesh",
        studentName: "Aarav",
        date: "2026-09-25",
        batchName: "Class 10 Maths",
        centreName: "Sharma Classes",
      }),
    ).toBe("Namaste Rajesh, Aarav was absent today (25 Sep 2026) for Class 10 Maths. – Sharma Classes");
  });
  it("says 'on <date>' for an earlier day", () => {
    expect(
      absenceMessage({
        parentName: "Rajesh",
        studentName: "Aarav",
        date: "2026-09-23",
        today: "2026-09-25",
        batchName: "Class 10 Maths",
        centreName: "Sharma Classes",
      }),
    ).toBe("Namaste Rajesh, Aarav was absent on 23 Sep 2026 for Class 10 Maths. – Sharma Classes");
  });
});

describe("formatMonthList", () => {
  it("lists months across years in full", () => {
    expect(formatMonthList(["2026-01-01", "2025-12-01"])).toBe("December 2025 and January 2026");
    expect(formatMonthList(["2026-07-01", "2026-08-01", "2026-09-01"])).toBe("July, August and September 2026");
  });
});
