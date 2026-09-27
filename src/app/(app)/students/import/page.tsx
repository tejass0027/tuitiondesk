import type { Metadata } from "next";
import Link from "next/link";
import { Layers, Plus } from "lucide-react";
import { getCentre } from "@/lib/auth";
import { studentKey } from "@/lib/import";
import { fetchAll } from "@/lib/fetch-all";
import { todayIST } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { ImportWizard } from "./import-wizard";

export const metadata: Metadata = { title: "Import students" };

export default async function ImportStudentsPage() {
  const { supabase } = await getCentre();
  const [{ data: batches }, students] = await Promise.all([
    supabase.from("batches").select("id, name, monthly_fee").eq("is_active", true).order("name"),
    // every student, however many (1000 per request)
    fetchAll((from, to) =>
      supabase.from("students").select("name, father_phone, mother_phone, parent_whatsapp").order("id").range(from, to),
    ),
  ]);

  // name + phone of everyone already added, to flag repeats before saving
  const existing = students.flatMap((s) =>
    [s.father_phone, s.mother_phone, s.parent_whatsapp].filter(Boolean).map((p) => studentKey(s.name, p)),
  );

  return (
    <>
      <PageHeader
        title="Import from Excel"
        backHref="/students"
        description="Add many students at once from an Excel or CSV sheet."
      />
      {!batches?.length ? (
        <EmptyState
          icon={Layers}
          title="Create a batch first"
          description="Every student belongs to a batch. Add a batch, then come back to import."
          action={
            <Button asChild size="lg">
              <Link href="/batches/new">
                <Plus aria-hidden /> Add a batch
              </Link>
            </Button>
          }
        />
      ) : (
        <ImportWizard
          batches={batches.map((b) => ({ ...b, monthly_fee: Number(b.monthly_fee) }))}
          existing={existing}
          today={todayIST()}
        />
      )}
    </>
  );
}
