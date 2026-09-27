import type { Metadata } from "next";
import Link from "next/link";
import { PartyPopper } from "lucide-react";
import { getCentre } from "@/lib/auth";
import { fetchAll } from "@/lib/fetch-all";
import { toOverdueGroup } from "@/lib/reminders";
import { feeReminderMessage } from "@/lib/whatsapp";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { RemindStepper } from "./remind-stepper";

export const metadata: Metadata = { title: "Remind overdue" };

export default async function RemindAllPage() {
  const { supabase, centre } = await getCentre();
  await supabase.rpc("generate_monthly_fees");

  // Every overdue student (1000 at a time, however many there are), A to Z
  const overdue = await fetchAll((from, to) =>
    supabase.rpc("overdue_students").order("student_name").order("student_id").range(from, to),
  );

  // One entry per student; one ready message per parent who gets reminders
  const parents = overdue.map(toOverdueGroup).map((p) => ({
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
