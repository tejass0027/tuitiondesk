import type { Metadata } from "next";
import Link from "next/link";
import { Layers, Plus } from "lucide-react";
import { getCentre } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { TestForm } from "../test-form";
import { createTest } from "../actions";

export const metadata: Metadata = { title: "New test" };

export default async function NewTestPage({ searchParams }: PageProps<"/tests/new">) {
  const { batch } = await searchParams;
  const { supabase } = await getCentre();
  const { data: batches } = await supabase.from("batches").select("id, name").eq("is_active", true).order("name");

  return (
    <>
      <PageHeader title="New test" backHref="/tests" />
      {!batches?.length ? (
        <EmptyState
          icon={Layers}
          title="Create a batch first"
          description="Every test belongs to a batch."
          action={
            <Button asChild size="lg">
              <Link href="/batches/new">
                <Plus aria-hidden /> Add a batch
              </Link>
            </Button>
          }
        />
      ) : (
        <TestForm
          action={createTest}
          batches={batches}
          defaultBatchId={typeof batch === "string" ? batch : undefined}
          submitLabel="Create test & enter marks"
        />
      )}
    </>
  );
}
