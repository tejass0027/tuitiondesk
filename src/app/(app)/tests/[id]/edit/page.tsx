import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCentre } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { TestForm } from "../../test-form";
import { updateTest } from "../../actions";
import { DeleteTestButton } from "./delete-test-button";

export const metadata: Metadata = { title: "Edit test" };

export default async function EditTestPage({ params }: PageProps<"/tests/[id]/edit">) {
  const { id } = await params;
  const { supabase } = await getCentre();

  const [{ data: test }, { data: batches }] = await Promise.all([
    supabase.from("tests").select("*").eq("id", id).maybeSingle(),
    supabase.from("batches").select("id, name, is_active").order("name"),
  ]);
  if (!test) notFound();

  const options = (batches ?? []).filter((b) => b.is_active || b.id === test.batch_id);

  return (
    <>
      <PageHeader title="Edit test" backHref={`/tests/${test.id}`} />
      <TestForm action={updateTest.bind(null, test.id)} batches={options} test={test} submitLabel="Save changes" />
      <section className="mt-10 grid gap-3 border-t pt-8">
        <h2 className="text-lg font-bold">Delete test</h2>
        <p className="text-sm text-muted-foreground">Removes this test and every mark entered for it.</p>
        <DeleteTestButton testId={test.id} testName={test.name} />
      </section>
    </>
  );
}
