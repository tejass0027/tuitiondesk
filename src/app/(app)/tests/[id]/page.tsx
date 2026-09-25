import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Plus, UserPlus } from "lucide-react";
import { getCentre } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { formatMarks } from "@/lib/marks";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { MarksSheet } from "./marks-sheet";

export const metadata: Metadata = { title: "Enter marks" };

export default async function TestMarksPage({ params }: PageProps<"/tests/[id]">) {
  const { id } = await params;
  const { supabase, centre } = await getCentre();

  const { data: test } = await supabase.from("tests").select("*, batches(name)").eq("id", id).maybeSingle();
  if (!test) notFound();

  const { data: marks } = await supabase.from("test_marks").select("student_id, marks, absent").eq("test_id", id);
  const markedIds = new Set((marks ?? []).map((m) => m.student_id));

  // Students in the batch, plus anyone who already has marks here (e.g. moved batch since)
  const { data: students } = await supabase
    .from("students")
    .select("id, name, parent_name, parent_whatsapp, is_active, batch_id")
    .or(
      markedIds.size
        ? `batch_id.eq.${test.batch_id},id.in.(${[...markedIds].join(",")})`
        : `batch_id.eq.${test.batch_id}`,
    )
    .order("name");

  const sheetStudents = (students ?? []).filter(
    (s) => (s.batch_id === test.batch_id && s.is_active) || markedIds.has(s.id),
  );
  const saved = Object.fromEntries((marks ?? []).map((m) => [m.student_id, { marks: m.marks, absent: m.absent }]));

  return (
    <>
      <PageHeader
        title={test.name}
        backHref="/tests"
        description={[test.subject, test.batches?.name, formatDate(test.test_date), `Out of ${formatMarks(test.max_marks)}`]
          .filter(Boolean)
          .join(" · ")}
        action={
          <Button asChild variant="outline" size="icon" aria-label="Edit test">
            <Link href={`/tests/${test.id}/edit`}>
              <Pencil aria-hidden />
            </Link>
          </Button>
        }
      />

      {sheetStudents.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="No students in this batch"
          description="Add students to this batch, then come back to enter their marks."
          action={
            <Button asChild size="lg">
              <Link href={`/students/new?batch=${test.batch_id}`}>
                <Plus aria-hidden /> Add a student
              </Link>
            </Button>
          }
        />
      ) : (
        <MarksSheet
          test={{ ...test, max_marks: Number(test.max_marks) }}
          students={sheetStudents}
          saved={saved}
          centreName={centre.name}
        />
      )}
    </>
  );
}
