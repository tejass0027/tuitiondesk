import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCentre } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { BatchForm } from "../batch-form";
import { updateBatch } from "../actions";
import { BatchDangerZone } from "./batch-danger-zone";

export const metadata: Metadata = { title: "Edit batch" };

export default async function EditBatchPage({ params }: PageProps<"/batches/[id]">) {
  const { id } = await params;
  const { supabase } = await getCentre();
  const { data: batch } = await supabase
    .from("batches")
    .select("*, students(count)")
    .eq("id", id)
    .maybeSingle();

  if (!batch) notFound();

  const { students, ...batchRow } = batch;

  return (
    <>
      <PageHeader title="Edit batch" backHref="/batches" />
      <BatchForm
        action={updateBatch.bind(null, batch.id)}
        batch={batchRow}
        submitLabel="Save changes"
      />
      <BatchDangerZone
        batchId={batch.id}
        batchName={batch.name}
        isActive={batch.is_active}
        studentCount={students[0]?.count ?? 0}
      />
    </>
  );
}
