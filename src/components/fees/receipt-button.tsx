"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function receiptUrl(paymentId: string) {
  return `/fees/receipt/${paymentId}`;
}

/** Can this browser share a PDF file into WhatsApp etc.? (true on most phones) */
function canShareFiles() {
  try {
    return Boolean(navigator.canShare?.({ files: [new File([""], "receipt.pdf", { type: "application/pdf" })] }));
  } catch {
    return false;
  }
}

/**
 * Phones: fetch the receipt PDF and open the share sheet (pick WhatsApp -> parent's chat).
 * Computers: open the PDF in a new tab to print or save.
 */
export async function shareReceipt(paymentId: string, studentName: string) {
  const url = receiptUrl(paymentId);
  if (!canShareFiles()) {
    window.open(url, "_blank", "noopener");
    return;
  }
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("PDF failed");
    const fileName = /filename="([^"]+)"/.exec(res.headers.get("content-disposition") ?? "")?.[1] ?? "Receipt.pdf";
    const file = new File([await res.blob()], fileName, { type: "application/pdf" });
    await navigator.share({ files: [file], title: `Fee receipt – ${studentName}`, text: `Fee receipt for ${studentName}` });
  } catch (err) {
    // Closing the share sheet is not an error
    if (!(err instanceof DOMException && err.name === "AbortError")) toast.error("Could not create the receipt.");
  }
}

/** Small "receipt" button next to a payment. */
export function ReceiptButton({
  paymentId,
  studentName,
  label,
  className,
}: {
  paymentId: string;
  studentName: string;
  label?: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const Icon = busy ? Loader2 : ReceiptText;

  return (
    <Button
      type="button"
      variant={label ? "outline" : "ghost"}
      size={label ? "sm" : "icon-sm"}
      disabled={busy}
      aria-label={label ? undefined : `Receipt for ${studentName}`}
      title="Fee receipt (PDF)"
      className={className}
      onClick={async () => {
        setBusy(true);
        await shareReceipt(paymentId, studentName);
        setBusy(false);
      }}
    >
      <Icon className={cn("size-4.5", busy ? "animate-spin" : label ? "" : "text-primary")} aria-hidden />
      {label}
    </Button>
  );
}
