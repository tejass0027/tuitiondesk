import type { Metadata } from "next";
import Link from "next/link";
import { PartyPopper } from "lucide-react";
import { getCentre } from "@/lib/auth";
import { groupOverdueByStudent } from "@/lib/reminders";
import { feeReminderMessage } from "@/lib/whatsapp";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { RemindStepper } from "./remind-stepper";

export const metadata: Metadata = { title: "Remind overdue" };

export default async function RemindAllPage() {
  const { supabase, centre } = await getCentre();
  await supabase.rpc("generate_monthly_fees");

  const { data: overdue } = await supabase
    .from("fee_overview")
    .select("id, student_id, student_name, parent_name, parent_whatsapp, batch_name, month, balance, father_name, father_phone, mother_name, mother_phone, contact_parent")
    .eq("status", "overdue")
    .order("student_name")
    .order("month");

  // One entry per student; one ready message per parent who gets reminders
  const parents = groupOverdueByStudent(overdue ?? []).map((p) => ({
    ...p,
    messages: p.recipients.map((r) =>
      feeReminderMessage({
        parentName: r.name,
        studentName: p.studentName,
        amount: p.total,
        months: p.months,
        centreName: centre.name,
      }),
    ),
  }));

  return (
    <>
      <PageHeader
        title="Remind overdue"
        backHref="/fees?tab=overdue"
        description={parents.length ? `${parents.length} ${parents.length === 1 ? "student" : "students"} to remind, one at a time` : undefined}
      />
      {parents.length === 0 ? (
        <EmptyState
          icon={PartyPopper}
          title="No overdue fees"
          description="Every parent is up to date. Nobody needs a reminder right now."
          action={
            <Button asChild size="lg" variant="outline">
              <Link href="/fees">Back to fees</Link>
            </Button>
          }
        />
      ) : (
        <RemindStepper parents={parents} />
      )}
    </>
  );
}
