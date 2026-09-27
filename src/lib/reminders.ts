import { messageRecipients, type ContactParent, type MessageRecipient } from "@/lib/parents";

/** One row of the database's overdue_students(): a student and all their unpaid, overdue months. */
export type OverdueStudentRow = {
  student_id: string;
  student_name: string;
  parent_name: string;
  parent_whatsapp: string;
  father_name: string;
  father_phone: string | null;
  mother_name: string;
  mother_phone: string | null;
  contact_parent: ContactParent;
  batch_name: string | null;
  months: string[];
  total: number | string;
  latest_fee_id: string;
};

export type OverdueGroup = {
  studentId: string;
  studentName: string;
  parentName: string;
  phone: string;
  batchName: string | null;
  months: string[];
  total: number;
  /** newest unpaid fee, used to link the reminder log entry */
  latestFeeId: string;
  /** father, mother or both, depending on the student's setting */
  recipients: MessageRecipient[];
};

/** A database row -> what the reminder screens need, including which parent(s) to message. */
export function toOverdueGroup(row: OverdueStudentRow): OverdueGroup {
  return {
    studentId: row.student_id,
    studentName: row.student_name,
    parentName: row.parent_name,
    phone: row.parent_whatsapp,
    batchName: row.batch_name,
    months: row.months,
    total: Number(row.total),
    latestFeeId: row.latest_fee_id,
    recipients: messageRecipients(row),
  };
}
