import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarCheck, NotebookPen } from "lucide-react";
import { getCentre } from "@/lib/auth";
import { todayIST } from "@/lib/format";
import { loadReportData, resolvePeriod } from "@/lib/report-data";
import { PageHeader } from "@/components/layout/page-header";
import { ReportOptions } from "./report-options";

export const metadata: Metadata = { title: "Report card" };

export default async function ReportCardPage({ params, searchParams }: PageProps<"/students/[id]/report">) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase, centre } = await getCentre();
  const today = todayIST();
  const period = resolvePeriod(query, today);

  const data = await loadReportData(supabase, centre, id, period.from, period.to);
  if (!data) notFound();

  return (
    <>
      <PageHeader title="Report card" description={data.student.name} backHref={`/students/${id}`} />

      {/* Quick preview of what the PDF will contain */}
      <section aria-label="Summary for this period" className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/8">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <CalendarCheck className="size-4" aria-hidden /> Attendance
          </p>
          <p className="mt-1 text-2xl font-bold">
            {data.attendance.percent === null ? "–" : `${data.attendance.percent}%`}
          </p>
          <p className="text-sm text-muted-foreground">
            {data.attendance.total
              ? `${data.attendance.present} of ${data.attendance.total} ${data.attendance.total === 1 ? "class" : "classes"}`
              : "No classes marked"}
          </p>
        </div>
        <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/8">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <NotebookPen className="size-4" aria-hidden /> Test average
          </p>
          <p className="mt-1 text-2xl font-bold">{data.marks.average === null ? "–" : `${data.marks.average}%`}</p>
          <p className="text-sm text-muted-foreground">
            {data.marks.tests.length
              ? `${data.marks.written} of ${data.marks.tests.length} ${data.marks.tests.length === 1 ? "test" : "tests"} written`
              : "No tests in this period"}
          </p>
        </div>
      </section>

      <ReportOptions
        studentId={id}
        studentName={data.student.name}
        parentName={data.student.parentName}
        centreName={centre.name}
        period={{ preset: period.preset, from: period.from, to: period.to, label: period.label }}
        today={today}
      />
    </>
  );
}
