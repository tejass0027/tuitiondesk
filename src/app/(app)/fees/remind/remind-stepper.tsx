"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CircleCheck, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { InitialsAvatar } from "@/components/shared/initials-avatar";
import { WhatsAppSendButton } from "@/components/reminders/reminder-sheet";
import { formatINR } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { formatMonthList } from "@/lib/whatsapp";
import type { OverdueGroup } from "@/lib/reminders";

export type OverdueParent = OverdueGroup & { message: string };

/**
 * Goes through overdue parents one by one:
 * Open WhatsApp → (tap Send in WhatsApp, come back) → Next parent.
 */
export function RemindStepper({ parents }: { parents: OverdueParent[] }) {
  const [index, setIndex] = useState(0);
  const [messages, setMessages] = useState(() => parents.map((p) => p.message));
  const [opened, setOpened] = useState<Set<number>>(new Set());

  const done = index >= parents.length;
  const sentCount = opened.size;

  if (done) {
    return (
      <div className="grid justify-items-center gap-4 rounded-2xl bg-success-soft p-8 text-center">
        <CircleCheck className="size-14 text-success" aria-hidden />
        <h2 className="text-2xl font-bold">All done!</h2>
        <p className="text-lg">
          You opened WhatsApp for {sentCount} of {parents.length} parents. Every one is saved in the reminder log.
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
  const wasOpened = opened.has(index);
  const next = () => setIndex((i) => i + 1);

  return (
    <div className="grid grid-cols-1 gap-4">
      {/* Progress */}
      <div>
        <div className="flex items-center justify-between text-base font-semibold">
          <span>
            Parent {index + 1} of {parents.length}
          </span>
          <span className="text-muted-foreground">{sentCount} opened</span>
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
          <p className="text-[0.95rem] text-muted-foreground">
            {p.parentName || "Parent"} · {formatPhone(p.phone)}
          </p>
          <p className="mt-1 text-base font-semibold text-danger">
            {formatINR(p.total)} overdue · {formatMonthList(p.months)}
          </p>
        </div>
      </div>

      {/* Message */}
      <div className="grid gap-2">
        <label htmlFor="stepper-message" className="text-base font-semibold">
          Message
        </label>
        <Textarea
          id="stepper-message"
          rows={5}
          value={messages[index]}
          onChange={(e) => setMessages((all) => all.map((m, i) => (i === index ? e.target.value : m)))}
          className="text-base leading-relaxed"
        />
      </div>

      {/* Actions */}
      {wasOpened ? (
        <Button size="lg" onClick={next} className="w-full">
          {index + 1 < parents.length ? "Next parent" : "Finish"} <ArrowRight aria-hidden />
        </Button>
      ) : (
        <WhatsAppSendButton
          recipient={{ studentId: p.studentId, studentName: p.studentName, parentName: p.parentName, phone: p.phone }}
          type="fee"
          feeRecordId={p.latestFeeId}
          message={messages[index]}
          onOpened={() => setOpened((s) => new Set(s).add(index))}
        >
          Open WhatsApp
        </WhatsAppSendButton>
      )}
      <div className="flex justify-between gap-2">
        {wasOpened ? (
          <WhatsAppSendButton
            recipient={{ studentId: p.studentId, studentName: p.studentName, parentName: p.parentName, phone: p.phone }}
            type="fee"
            feeRecordId={p.latestFeeId}
            message={messages[index]}
            className="h-10 w-auto bg-transparent px-3 text-base text-success hover:bg-success-soft"
          >
            Open again
          </WhatsAppSendButton>
        ) : (
          <span />
        )}
        {!wasOpened && (
          <Button variant="ghost" onClick={next}>
            <SkipForward aria-hidden /> Skip this parent
          </Button>
        )}
      </div>
    </div>
  );
}
