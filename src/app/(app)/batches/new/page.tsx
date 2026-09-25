import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { BatchForm } from "../batch-form";
import { createBatch } from "../actions";

export const metadata: Metadata = { title: "Add batch" };

export default function NewBatchPage() {
  return (
    <>
      <PageHeader title="Add batch" backHref="/batches" />
      <BatchForm action={createBatch} submitLabel="Save batch" />
    </>
  );
}
