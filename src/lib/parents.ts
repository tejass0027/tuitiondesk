export type ContactParent = "father" | "mother" | "both";

type ParentFields = {
  father_name: string;
  father_phone: string | null;
  mother_name: string;
  mother_phone: string | null;
  contact_parent: ContactParent;
  /** fallback for older rows */
  parent_name?: string;
  parent_whatsapp?: string;
};

export type MessageRecipient = {
  who: "father" | "mother";
  label: "Father" | "Mother";
  name: string;
  phone: string;
};

/**
 * Which parent(s) should get WhatsApp messages for this student.
 * "both" gives two recipients; a chosen parent without a phone falls back to the other.
 */
export function messageRecipients(s: ParentFields): MessageRecipient[] {
  const father: MessageRecipient | null = s.father_phone
    ? { who: "father", label: "Father", name: s.father_name, phone: s.father_phone }
    : null;
  const mother: MessageRecipient | null = s.mother_phone
    ? { who: "mother", label: "Mother", name: s.mother_name, phone: s.mother_phone }
    : null;

  let list: (MessageRecipient | null)[];
  if (s.contact_parent === "both") list = [father, mother];
  else if (s.contact_parent === "mother") list = [mother ?? father];
  else list = [father ?? mother];

  const result = list.filter((r): r is MessageRecipient => r !== null);
  if (result.length === 0 && s.parent_whatsapp) {
    return [{ who: "father", label: "Father", name: s.parent_name ?? "", phone: s.parent_whatsapp }];
  }
  return result;
}

/** "Father", "Mother" or "Father & Mother", for small labels. */
export function recipientsLabel(recipients: MessageRecipient[]): string {
  return recipients.map((r) => r.label).join(" & ");
}
