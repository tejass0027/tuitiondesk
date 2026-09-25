"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Eye, Loader2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/shared/form-field";
import { PERIODS } from "@/lib/report";
import { cn } from "@/lib/utils";
import { logReminder } from "@/app/(app)/reminders/actions";

type Props = {
  studentId: string;
  studentName: string;
  parentName: string;
  centreName: string;
  period: { preset: string; from: string; to: string; label: string };
  today: string;
};

const CHOICES = [...PERIODS, { value: "custom", label: "Pick dates" }] as const;

/**
 * Choose the period and remarks, then view / download / share the PDF.
 * Changing the period reloads the page so the summary above stays in sync.
 */
export function ReportOptions({ studentId, studentName, parentName, centreName, period, today }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [navigating, startNavigation] = useTransition();
  const [from, setFrom] = useState(period.from);
  const [to, setTo] = useState(period.to);
  const [remarks, setRemarks] = useState("");
  const [sharing, setSharing] = useState(false);

  function choose(preset: string, customFrom = from, customTo = to) {
    const params = new URLSearchParams({ period: preset });
    if (preset === "custom") {
      params.set("from", customFrom);
      params.set("to", customTo);
    }
    startNavigation(() => router.replace(`${pathname}?${params}`, { scroll: false }));
  }

  function pdfUrl(download: boolean) {
    const params = new URLSearchParams({ period: period.preset });
    if (period.preset === "custom") {
      params.set("from", period.from);
      params.set("to", period.to);
    }
    if (remarks.trim()) params.set("remarks", remarks.trim());
    if (download) params.set("download", "1");
    return `/students/${studentId}/report/pdf?${params}`;
  }

  /**
   * On phones, share the PDF file straight into WhatsApp (or any app) using the
   * Web Share API. Where that isn't supported, fall back to downloading it.
   */
  async function share() {
    setSharing(true);
    try {
      const res = await fetch(pdfUrl(false));
      if (!res.ok) throw new Error("PDF failed");
      const blob = await res.blob();
      const fileName = /filename="([^"]+)"/.exec(res.headers.get("content-disposition") ?? "")?.[1] ?? "Report.pdf";
      const file = new File([blob], fileName, { type: "application/pdf" });
      const text = `${parentName ? `Namaste ${parentName}, ` : ""}here is ${studentName}'s progress report for ${period.label}. – ${centreName}`;

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${studentName} – report card`, text });
        await logReminder({ studentId, type: "result", message: `Report card shared (${period.label})` });
        toast.success("Report card shared");
      } else {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(link.href);
        toast.info("Sharing isn’t supported here, so the PDF was downloaded instead.");
      }
    } catch (err) {
      // Closing the share sheet is not an error
      if (!(err instanceof DOMException && err.name === "AbortError")) toast.error("Could not create the report card.");
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-6">
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-base font-semibold">Report period</legend>
        <div className="grid grid-cols-2 gap-2">
          {CHOICES.map((c) => {
            const active = period.preset === c.value;
            return (
              <button
                key={c.value}
                type="button"
                aria-pressed={active}
                disabled={navigating}
                onClick={() => choose(c.value)}
                className={cn(
                  "min-h-12 rounded-xl border-2 px-3 py-2 text-left text-[0.95rem] leading-tight font-semibold transition-colors",
                  active ? "border-primary bg-accent text-accent-foreground" : "border-input bg-card text-muted-foreground",
                )}
              >
                {c.label}
              </button>
            );
          })}
        </div>
        <p className="text-sm text-muted-foreground">
          {navigating ? "Updating…" : `Showing ${period.label}`}
        </p>
      </fieldset>

      {period.preset === "custom" && (
        <div className="grid grid-cols-2 gap-3">
          <FormField label="From" htmlFor="from">
            <Input
              id="from"
              type="date"
              max={to}
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                if (e.target.value && e.target.value <= to) choose("custom", e.target.value, to);
              }}
            />
          </FormField>
          <FormField label="To" htmlFor="to">
            <Input
              id="to"
              type="date"
              min={from}
              max={today}
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                if (e.target.value && from <= e.target.value) choose("custom", from, e.target.value);
              }}
            />
          </FormField>
        </div>
      )}

      <FormField
        label="Teacher’s remarks"
        htmlFor="remarks"
        hint={`Optional. Printed on the report card. ${600 - remarks.length} characters left.`}
      >
        <Textarea
          id="remarks"
          rows={4}
          maxLength={600}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="e.g. Regular with homework. Needs more practice in Trigonometry."
        />
      </FormField>

      <div className="grid gap-3">
        <Button size="lg" onClick={share} disabled={sharing || navigating} className="bg-[#1f9d55] text-white hover:bg-[#1a8a4a]">
          {sharing ? <Loader2 className="animate-spin" aria-hidden /> : <Share2 aria-hidden />}
          {sharing ? "Preparing PDF…" : "Share PDF (WhatsApp…)"}
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button asChild variant="outline" size="lg" aria-disabled={navigating}>
            <a href={pdfUrl(true)} download>
              <Download aria-hidden /> Download
            </a>
          </Button>
          <Button asChild variant="outline" size="lg" aria-disabled={navigating}>
            <a href={pdfUrl(false)} target="_blank" rel="noopener noreferrer">
              <Eye aria-hidden /> View
            </a>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          On a phone, <strong>Share PDF</strong> lets you pick WhatsApp and the parent’s chat. The PDF is attached, ready to send.
        </p>
      </div>
    </div>
  );
}
