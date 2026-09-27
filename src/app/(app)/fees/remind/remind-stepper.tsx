"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, CircleCheck, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { InitialsAvatar } from "@/components/shared/initials-avatar";
import { WhatsAppSendButton } from "@/components/reminders/reminder-sheet";
import { formatINR } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { formatMonthList } from "@/lib/whatsapp";
import { recipientsLabel } from "@/lib/parents";
import { cn } from "@/lib/utils";
import type { OverdueGroup } from "@/lib/reminders";

/** One student with overdue fees, and one ready message per parent who gets reminders. */
export type OverdueParent = OverdueGroup & { messages: string[] };

/**
 * Goes through overdue students one by one:
 * Open WhatsApp (for each parent) → tap Send in WhatsApp, come back → Next.
 */
export function RemindStepper({ parents }: { parents: OverdueParent[] }) {
  const [index, setIndex] = useState(0);
  // messages[student][parent], so the owner can edit each one
  const [messages, setMessages] = useState(() => parents.map((p) => [...p.messages]));
  // "3-1" = student 3, parent 1 has been opened
  const [opened, setOpened] = useState<Set<string>>(new Set());

  const done = index >= parents.length;
  const studentsReached = new Set([...opened].map((k) => k.split("-")[0])).size;

  if (done) {
    return (
      <div className="grid justify-items-center gap-4 rounded-2xl bg-success-soft p-8 text-center">
        <CircleCheck className="size-14 text-success" aria-hidden />
        <h2 className="text-2xl font-bold">All done!</h2>
        <p className="text-lg">
          You messaged the parents of {studentsReached} of {parents.length} students ({opened.size}{" "}
          {opened.size === 1 ? "message" : "messages"}). Every one is saved in the reminder log.
        </p>
        <div className="grid w-full gap-2 sm:w-auto sm:grid-flow-col">
          <Button asChild size="lg">
            <Link href="/fees?tab=overdue">Back to fees</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/reminders">See reminder log</Link>
          </Button>
        </div>
      </div>
    );
  }

  const p = parents[index];
  const openedHere = p.recipients.map((_, j) => opened.has(`${index}-${j}`));
  const anyOpened = openedHere.some(Boolean);
  const next = () => setIndex((i) => i + 1);
  const several = p.recipients.length > 1;

  return (
    <div className="grid grid-cols-1 gap-4">
      {/* Progress */}
      <div>
        <div className="flex items-center justify-between text-base font-semibold">
          <span>
            Student {index + 1} of {parents.length}
          </span>
          <span className="text-muted-foreground">
            {opened.size} {opened.size === 1 ? "message" : "messages"} opened
          </span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(index / parents.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Who */}
      <div className="flex items-center gap-4 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/8">
        <InitialsAvatar name={p.studentName} className="size-14 text-lg" />
        <div className="min-w-0 flex-1">
          <p className="text-xl leading-snug font-bold">{p.studentName}</p>
          <p className="text-[0.95rem] text-muted-foreground">Messages go to: {recipientsLabel(p.recipients)}</p>
          <p className="mt-1 text-base font-semibold text-danger">
            {formatINR(p.total)} overdue · {formatMonthList(p.months)}
          </p>
        </div>
      </div>

      {/* One message + one WhatsApp button per parent */}
      {p.recipients.map((r, j) => (
        <div
          key={r.phone}
          className={cn("grid gap-2", several && "rounded-2xl bg-muted/50 p-3 ring-1 ring-foreground/5")}
        >
          <label htmlFor={`stepper-message-${j}`} className="flex flex-wrap justify-between gap-x-2 text-base font-semibold">
            <span>
              {r.label} · {r.name || "Parent"}
            </span>
            <span className="text-sm font-normal text-muted-foreground">{formatPhone(r.phone)}</span>
          </label>
          <Textarea
            id={`stepper-message-${j}`}
            rows={4}
            value={messages[index][j]}
            onChange={(e) =>
              setMessages((all) =>
                all.map((list, i) => (i === index ? list.map((m, k) => (k === j ? e.target.value : m)) : list)),
              )
            }
            className="text-base leading-relaxed"
          />
          <WhatsAppSendButton
            recipient={{ studentId: p.studentId, studentName: p.studentName, parentName: r.name, phone: r.phone }}
            type="fee"
            feeRecordId={p.latestFeeId}
            message={messages[index][j]}
            onOpened={() => setOpened((s) => new Set(s).add(`${index}-${j}`))}
          >
            {openedHere[j] ? (
              <>
                <Check aria-hidden /> Opened · open again
              </>
            ) : (
              `Open WhatsApp · ${r.label}`
            )}
          </WhatsAppSendButton>
        </div>
      ))}

      {/* Move on */}
      {anyOpened ? (
        <Button size="lg" variant={openedHere.every(Boolean) ? "default" : "outline"} onClick={next} className="w-full">
          {index + 1 < parents.length ? "Next student" : "Finish"} <ArrowRight aria-hidden />
        </Button>
      ) : (
        <Button variant="ghost" onClick={next} className="justify-self-end">
          <SkipForward aria-hidden /> Skip this student
        </Button>
      )}
    </div>
  );
}
