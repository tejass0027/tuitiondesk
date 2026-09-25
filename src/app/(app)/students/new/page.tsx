import type { Metadata } from "next";
import Link from "next/link";
import { Layers, Plus } from "lucide-react";
import { getCentre } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { StudentForm } from "../student-form";
import { createStudent } from "../actions";

export const metadata: Metadata = { title: "Add student" };

export default async function NewStudentPage({ searchParams }: PageProps<"/students/new">) {
  const { batch } = await searchParams;
  const { supabase } = await getCentre();
  const { data: classes } = await supabase.from("classes").select("name, sort_order").order("sort_order").order("name");
  const { data: batches } = await supabase
    .from("batches")
    .select("id, name, monthly_fee")
    .eq("is_active", true)
    .order("name");

  return (
    <>
      <PageHeader title="Add student" backHref="/students" />
      {!batches?.length ? (
        <EmptyState
          icon={Layers}
          title="Create a batch first"
          description="Every student belongs to a batch. Add your first batch, then come back here."
          action={
            <Button asChild size="lg">
              <Link href="/batches/new">
                <Plus aria-hidden /> Add a batch
              </Link>
            </Button>
          }
        />
      ) : (
        <StudentForm
          action={createStudent}
          batches={batches}
          classNames={(classes ?? []).map((c) => c.name)}
          defaultBatchId={typeof batch === "string" ? batch : undefined}
          submitLabel="Save student"
        />
      )}
    </>
  );
}
