import { createElement, type ReactElement } from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { getCentre } from "@/lib/auth";
import { todayIST } from "@/lib/format";
import { ReportCard } from "@/lib/pdf/report-card";
import { loadReportData, resolvePeriod } from "@/lib/report-data";

/**
 * GET /students/<id>/report/pdf?period=this-month
 * Builds the report card on the server and sends it back as a PDF file.
 */
export async function GET(request: Request, { params }: RouteContext<"/students/[id]/report/pdf">) {
  const { id } = await params;
  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams.entries());

  const { supabase, centre } = await getCentre();
  const today = todayIST();
  const period = resolvePeriod(query, today);
  const data = await loadReportData(supabase, centre, id, period.from, period.to);
  if (!data) return new Response("Student not found", { status: 404 });

  // ReportCard returns a <Document>, which is what renderToBuffer expects
  const pdf = await renderToBuffer(
    createElement(ReportCard, {
      centre: data.centre,
      student: data.student,
      periodLabel: period.label,
      attendance: data.attendance,
      marks: data.marks,
      generatedOn: today,
    }) as ReactElement<DocumentProps>,
  );

  const fileName = `Report-${data.student.name}-${period.label}`.replace(/[^\w-]+/g, "-").replace(/-+/g, "-");
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${url.searchParams.get("download") ? "attachment" : "inline"}; filename="${fileName}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
