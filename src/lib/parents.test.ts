import { describe, expect, it } from "vitest";
import { messageRecipients, recipientsLabel } from "./parents";

const base = {
  father_name: "Anil",
  father_phone: "919811111111",
  mother_name: "Sunita",
  mother_phone: "919822222222",
};

describe("messageRecipients", () => {
  it("returns both parents for 'both'", () => {
    const r = messageRecipients({ ...base, contact_parent: "both" });
    expect(r.map((x) => x.name)).toEqual(["Anil", "Sunita"]);
    expect(recipientsLabel(r)).toBe("Father & Mother");
  });
  it("returns only the chosen parent", () => {
    expect(messageRecipients({ ...base, contact_parent: "mother" }).map((x) => x.name)).toEqual(["Sunita"]);
    expect(messageRecipients({ ...base, contact_parent: "father" }).map((x) => x.name)).toEqual(["Anil"]);
  });
  it("skips a parent without a phone", () => {
    expect(
      messageRecipients({ ...base, mother_phone: null, contact_parent: "both" }).map((x) => x.name),
    ).toEqual(["Anil"]);
    expect(
      messageRecipients({ ...base, mother_phone: null, contact_parent: "mother" }).map((x) => x.name),
    ).toEqual(["Anil"]);
  });
});
