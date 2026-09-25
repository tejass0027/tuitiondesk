import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCentre } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { StudentForm } from "../../student-form";
import { updateStudent } from "../../actions";
import { StudentDangerZone } from "./student-danger-zone";

export const metadata: Metadata = { title: "Edit student" };

export default async function EditStudentPage({ params }: PageProps<"/students/[id]/edit">) {
  const { id } = await params;
  const { supabase } = await getCentre();

  const [{ data: student }, { data: batches }] = await Promise.all([
    supabase.from("students").select("*").eq("id", id).maybeSingle(),
    supabase.from("batches").select("id, name, monthly_fee, is_active").order("name"),
  ]);
  if (!student) notFound();

  // Active batches, plus the student's current one even if it's archived
  const options = (batches ?? []).filter((b) => b.is_active || b.id === student.batch_id);

  return (
    <>
      <PageHeader title="Edit student" backHref={`/students/${student.id}`} />
      <StudentForm
        action={updateStudent.bind(null, student.id)}
        batches={options}
        student={student}
        submitLabel="Save changes"
      />
      <StudentDangerZone studentId={student.id} studentName={student.name} isActive={student.is_active} />
    </>
  );
}
