import { createElement, type ReactElement } from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { getCentre } from "@/lib/auth";
import { paymentModeLabel } from "@/lib/fees";
import { classLabel } from "@/lib/classes";
import { formatPhone } from "@/lib/phone";
import { FeeReceipt } from "@/lib/pdf/fee-receipt";
import { paidUpTo, receiptNumber } from "@/lib/receipt";

/**
 * GET /fees/receipt/<paymentId>
 * A PDF receipt for one payment. RLS makes sure owners only see their own centre's payments.
 */
export async function GET(request: Request, { params }: RouteContext<"/fees/receipt/[paymentId]">) {
  const { paymentId } = await params;
  const { supabase, centre } = await getCentre();

  const { data: payment } = await supabase
    .from("payments")
    .select("id, fee_record_id, amount, paid_on, mode, note, created_at")
    .eq("id", paymentId)
    .maybeSingle();
  if (!payment) return new Response("Receipt not found", { status: 404 });

  const [{ data: fee }, { data: allPayments }] = await Promise.all([
    supabase
      .from("fee_overview")
      .select("month, amount_due, student_name, student_class, parent_name, batch_name")
      .eq("id", payment.fee_record_id)
      .maybeSingle(),
    supabase.from("payments").select("id, amount, paid_on, created_at").eq("fee_record_id", payment.fee_record_id),
  ]);
  if (!fee) return new Response("Receipt not found", { status: 404 });

  // Balance as it was right after this payment (later payments don't change an old receipt)
  const paidSoFar = paidUpTo(allPayments ?? [], payment.id);
  const receiptNo = receiptNumber(payment.id, payment.paid_on);

  const pdf = await renderToBuffer(
    createElement(FeeReceipt, {
      receiptNo,
      centre: { name: centre.name, address: centre.address, phone: centre.phone ? formatPhone(centre.phone) : "" },
      student: {
        name: fee.student_name,
        class: fee.student_class ? classLabel(fee.student_class) : "",
        batch: fee.batch_name ?? "",
        parentName: fee.parent_name,
      },
      month: fee.month,
      payment: {
        amount: Number(payment.amount),
        paidOn: payment.paid_on,
        mode: paymentModeLabel(payment.mode),
        note: payment.note,
      },
      fee: { due: Number(fee.amount_due), paidSoFar, balance: Number(fee.amount_due) - paidSoFar },
    }) as ReactElement<DocumentProps>,
  );

  const fileName = `Receipt-${receiptNo}-${fee.student_name}`.replace(/[^\w-]+/g, "-").replace(/-+/g, "-");
  const download = new URL(request.url).searchParams.get("download");
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${fileName}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
