type OverdueFee = {
  id: string;
  student_id: string;
  student_name: string;
  parent_name: string;
  parent_whatsapp: string;
  batch_name: string | null;
  month: string;
  balance: number;
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
};

/**
 * Turns overdue fee rows into one entry per student, so a parent with
 * two unpaid months gets a single message with the total.
 * Keeps the order students first appear in.
 */
export function groupOverdueByStudent(fees: OverdueFee[]): OverdueGroup[] {
  const byStudent = new Map<string, OverdueGroup>();
  for (const f of fees) {
    const group = byStudent.get(f.student_id) ?? {
      studentId: f.student_id,
      studentName: f.student_name,
      parentName: f.parent_name,
      phone: f.parent_whatsapp,
      batchName: f.batch_name,
      months: [],
      total: 0,
      latestFeeId: f.id,
    };
    const isNewest = group.months.every((m) => f.month >= m);
    group.months.push(f.month);
    group.total += Number(f.balance);
    if (isNewest) group.latestFeeId = f.id;
    byStudent.set(f.student_id, group);
  }
  return [...byStudent.values()];
}
