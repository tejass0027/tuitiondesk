"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CircleAlert,
  CircleCheck,
  ClipboardPaste,
  Copy,
  Download,
  FileSpreadsheet,
  Loader2,
  RotateCcw,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/shared/native-select";
import { formatDate, formatINR } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { type Cell, type ImportBatch, type ImportResult, parseDelimited, readStudentRows, templateCsv } from "@/lib/import";
import { cn } from "@/lib/utils";
import { importStudents } from "./actions";

type Props = { batches: ImportBatch[]; existing: string[]; today: string };

/**
 * 1. download the template (optional)  2. pick a default batch
 * 3. choose a file or paste cells      4. check the preview -> add them all
 */
export function ImportWizard({ batches, existing, today }: Props) {
  const router = useRouter();
  const [defaultBatchId, setDefaultBatchId] = useState(batches[0].id);
  const [sheet, setSheet] = useState<Cell[][] | null>(null);
  const [fileName, setFileName] = useState("");
  const [reading, setReading] = useState(false);
  const [pasting, setPasting] = useState(false);
  const [pasted, setPasted] = useState("");
  const [saving, startSaving] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  const existingSet = useMemo(() => new Set(existing), [existing]);
  const result: ImportResult | null = useMemo(
    () => (sheet ? readStudentRows(sheet, { batches, defaultBatchId, today, existing: existingSet }) : null),
    [sheet, batches, defaultBatchId, today, existingSet],
  );

  const rows = result?.ok ? result.rows : [];
  const ready = rows.filter((r) => r.problems.length === 0 && !r.duplicate);
  const broken = rows.filter((r) => r.problems.length > 0 && !r.duplicate);
  const repeats = rows.filter((r) => r.duplicate);

  async function readFile(file: File) {
    setReading(true);
    setFileName(file.name);
    try {
      if (/\.xlsx$/i.test(file.name)) {
        const { readSheet } = await import("read-excel-file/browser");
        setSheet((await readSheet(file)) as Cell[][]);
      } else if (/\.(csv|txt|tsv)$/i.test(file.name)) {
        setSheet(parseDelimited(await file.text()));
      } else {
        toast.error("Please choose an Excel (.xlsx) or CSV file. Old .xls files: open in Excel and “Save As” .xlsx.");
        setFileName("");
      }
    } catch {
      toast.error("We couldn't read that file. Is it an Excel or CSV file?");
      setFileName("");
    } finally {
      setReading(false);
    }
  }

  function downloadTemplate() {
    const batchName = batches.find((b) => b.id === defaultBatchId)?.name ?? "";
    const blob = new Blob(["﻿" + templateCsv(batchName)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tuitiondesk-students.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function reset() {
    setSheet(null);
    setFileName("");
    setPasted("");
    if (fileInput.current) fileInput.current.value = "";
  }

  function save() {
    startSaving(async () => {
      const res = await importStudents(ready.map((r) => r.student));
      if (res?.ok) {
        toast.success(res.message);
        router.push("/students");
      } else {
        toast.error(res?.message ?? "Could not add the students.");
      }
    });
  }

  return (
    <div className="grid grid-cols-1 gap-5">
      {/* Step 1 + 2 */}
      <section className="grid gap-4 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/8">
        <Step n={1} title="Get the sheet ready">
          <p className="text-[0.95rem] text-muted-foreground">
            First row: headings like <b className="text-foreground">Name, Class, Batch, Father phone, Mother phone, Monthly fee</b>.
            Your own Excel works too, as long as it has a Name and a phone column.
          </p>
          <Button type="button" variant="outline" onClick={downloadTemplate} className="w-full sm:w-auto">
            <Download aria-hidden /> Download template
          </Button>
        </Step>

        <Step n={2} title="Batch for rows without one">
          <NativeSelect
            aria-label="Default batch"
            value={defaultBatchId}
            onChange={(e) => setDefaultBatchId(e.target.value)}
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} · {formatINR(b.monthly_fee)}/month
              </option>
            ))}
          </NativeSelect>
          <p className="text-sm text-muted-foreground">Empty fee → this batch&apos;s fee. Empty date → today.</p>
        </Step>
      </section>

      {/* Step 3 */}
      <section className="grid gap-4 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/8">
        <Step n={3} title="Choose your sheet">
          {!sheet ? (
            <>
              <label
                className={cn(
                  "flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-accent/40 p-6 text-center transition-colors hover:border-primary/60 hover:bg-accent",
                  reading && "pointer-events-none opacity-70",
                )}
              >
                {reading ? (
                  <Loader2 className="size-9 animate-spin text-primary" aria-hidden />
                ) : (
                  <Upload className="size-9 text-primary" aria-hidden />
                )}
                <span className="text-lg font-semibold">{reading ? `Reading ${fileName}…` : "Tap to choose a file"}</span>
                <span className="text-sm text-muted-foreground">Excel (.xlsx) or CSV</span>
                <input
                  ref={fileInput}
                  type="file"
                  accept=".xlsx,.csv,.tsv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void readFile(f);
                  }}
                />
              </label>

              {pasting ? (
                <div className="grid gap-2">
                  <Textarea
                    autoFocus
                    rows={6}
                    value={pasted}
                    onChange={(e) => setPasted(e.target.value)}
                    placeholder={"Select the cells in Excel (with the heading row), copy, and paste here"}
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    disabled={!pasted.trim()}
                    onClick={() => {
                      setFileName("Pasted cells");
                      setSheet(parseDelimited(pasted));
                    }}
                  >
                    <FileSpreadsheet aria-hidden /> Read pasted cells
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="ghost" onClick={() => setPasting(true)} className="justify-self-center">
                  <ClipboardPaste aria-hidden /> Or paste cells from Excel
                </Button>
              )}
            </>
          ) : (
            <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-3">
              <FileSpreadsheet className="size-8 shrink-0 text-success" aria-hidden />
              <p className="min-w-0 flex-1 truncate font-semibold">{fileName}</p>
              <Button type="button" variant="outline" size="sm" onClick={reset}>
                <RotateCcw aria-hidden /> Change
              </Button>
            </div>
          )}
        </Step>
      </section>

      {/* Step 4: preview */}
      {result && !result.ok && (
        <p role="alert" className="flex items-start gap-2.5 rounded-xl bg-danger-soft p-4 text-base font-medium text-danger">
          <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
          {result.message}
        </p>
      )}

      {result?.ok && (
        <section className="grid gap-3">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <span className="flex size-7 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">4</span>
            Check and add
          </h2>
          <div className="flex flex-wrap gap-2 text-sm font-semibold">
            <span className="rounded-full bg-success-soft px-3 py-1 text-success">{ready.length} ready</span>
            {broken.length > 0 && (
              <span className="rounded-full bg-danger-soft px-3 py-1 text-danger">{broken.length} need fixing</span>
            )}
            {repeats.length > 0 && (
              <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">{repeats.length} already added</span>
            )}
          </div>
          {broken.length > 0 && (
            <p className="text-[0.95rem] text-muted-foreground">
              Rows that need fixing will be skipped. Fix them in your sheet and choose it again, or add them one by one later.
            </p>
          )}

          <ul className="grid grid-cols-1 gap-2">
            {[...broken, ...ready, ...repeats].map((r) => (
              <li
                key={r.line}
                className={cn(
                  "rounded-xl bg-card p-3.5 shadow-sm ring-1 ring-foreground/8",
                  r.problems.length > 0 && !r.duplicate && "bg-danger-soft/40 ring-danger/30",
                  r.duplicate && "opacity-60",
                )}
              >
                <div className="flex items-start gap-2">
                  {r.duplicate ? (
                    <Copy className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
                  ) : r.problems.length ? (
                    <CircleAlert className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden />
                  ) : (
                    <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-baseline justify-between gap-x-2">
                      <span className="font-semibold">{r.student.name || "(no name)"}</span>
                      <span className="text-xs text-muted-foreground">Row {r.line}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {[r.student.class, r.batchName, `${formatINR(r.student.monthly_fee)}/month`, `joined ${formatDate(r.student.joining_date)}`]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {[
                        r.student.father_phone && `Father ${r.student.father_name ? `${r.student.father_name} ` : ""}${formatPhone(r.student.father_phone)}`,
                        r.student.mother_phone && `Mother ${r.student.mother_name ? `${r.student.mother_name} ` : ""}${formatPhone(r.student.mother_phone)}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {r.duplicate && <p className="mt-1 text-sm font-medium">Already added, will be skipped</p>}
                    {!r.duplicate &&
                      r.problems.map((p) => (
                        <p key={p} className="mt-1 text-sm font-medium text-danger">
                          {p}
                        </p>
                      ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="sticky bottom-28 z-10 lg:bottom-4">
            <Button size="lg" className="w-full shadow-lg" disabled={ready.length === 0 || saving} onClick={save}>
              {saving ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden /> Adding…
                </>
              ) : ready.length === 0 ? (
                "Nothing to add"
              ) : (
                `Add ${ready.length} ${ready.length === 1 ? "student" : "students"}`
              )}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2.5">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <span className="flex size-7 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">{n}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}
