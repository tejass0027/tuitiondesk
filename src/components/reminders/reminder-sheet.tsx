"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatPhone } from "@/lib/phone";
import { whatsappLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import type { ReminderType } from "@/types/database";
import { logReminder } from "@/app/(app)/reminders/actions";

type Recipient = {
  studentId: string;
  studentName: string;
  parentName: string;
  phone: string;
};

/**
 * Green "Open WhatsApp" link. It's a real <a> so the phone opens WhatsApp
 * straight away (no pop-up blockers); the reminder is logged at the same time.
 */
export function WhatsAppSendButton({
  recipient,
  type,
  message,
  feeRecordId,
  onOpened,
  className,
  children = "Open WhatsApp",
}: {
  recipient: Recipient;
  type: ReminderType;
  message: string;
  feeRecordId?: string | null;
  onOpened?: () => void;
  className?: string;
  children?: React.ReactNode;
}) {
  const empty = message.trim().length === 0;

  return (
    <Button
      asChild
      size="lg"
      className={cn("w-full bg-[#1f9d55] text-white hover:bg-[#1a8a4a]", empty && "pointer-events-none opacity-50", className)}
    >
      <a
        href={whatsappLink(recipient.phone, message)}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={empty}
        onClick={() => {
          logReminder({ studentId: recipient.studentId, type, message, feeRecordId })
            .then((r) => {
              if (!r?.ok) toast.error("WhatsApp opened, but the reminder could not be logged.");
            })
            .catch(() => toast.error("WhatsApp opened, but the reminder could not be logged."));
          onOpened?.();
        }}
      >
        <Send aria-hidden /> {children}
      </a>
    </Button>
  );
}

/** One parent to message, with their own ready-made text. */
export type SheetRecipient = {
  /** "Father" / "Mother" when a student has both */
  label?: string;
  parentName: string;
  phone: string;
  message: string;
};

/**
 * Editable message preview(s) in a bottom sheet, opened by a "Remind" style button.
 * With two recipients (both parents) there is one message + one WhatsApp button each,
 * because a WhatsApp link can only open one chat at a time.
 */
export function ReminderSheet({
  studentId,
  studentName,
  recipients,
  type,
  feeRecordId,
  title,
  triggerLabel = "Remind",
  triggerVariant = "outline",
  triggerSize = "sm",
  triggerClassName,
}: {
  studentId: string;
  studentName: string;
  recipients: SheetRecipient[];
  type: ReminderType;
  feeRecordId?: string | null;
  title: string;
  triggerLabel?: string;
  triggerVariant?: "outline" | "secondary" | "default";
  triggerSize?: "sm" | "default" | "lg";
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => recipients.map((r) => r.message));
  const [opened, setOpened] = useState<boolean[]>(() => recipients.map(() => false));
  const several = recipients.length > 1;

  if (recipients.length === 0) return null;

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          // start fresh each time
          setMessages(recipients.map((r) => r.message));
          setOpened(recipients.map(() => false));
        }
      }}
    >
      <SheetTrigger asChild>
        <Button variant={triggerVariant} size={triggerSize} className={triggerClassName}>
          <MessageCircle aria-hidden /> {triggerLabel}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[92dvh] max-w-lg overflow-y-auto rounded-t-3xl px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
      >
        <SheetHeader className="px-0 pb-0">
          <SheetTitle className="text-2xl font-bold">{title}</SheetTitle>
          <SheetDescription className="text-base">
            {several
              ? `Goes to both parents of ${studentName}. Send one, come back, then send the other.`
              : `To ${recipients[0].parentName || `${studentName}'s parent`} · ${formatPhone(recipients[0].phone)}`}
          </SheetDescription>
        </SheetHeader>

        {recipients.map((r, i) => (
          <div key={r.phone + i} className={cn("grid gap-2", several && "rounded-2xl bg-muted/50 p-3 ring-1 ring-foreground/5")}>
            <label htmlFor={`reminder-message-${i}`} className="flex flex-wrap items-baseline justify-between gap-x-2 text-base font-semibold">
              <span>{several ? `${r.label ?? "Parent"} · ${r.parentName || "Parent"}` : "Message"}</span>
              {several && <span className="text-sm font-normal text-muted-foreground">{formatPhone(r.phone)}</span>}
            </label>
            <Textarea
              id={`reminder-message-${i}`}
              value={messages[i]}
              onChange={(e) => setMessages((all) => all.map((m, j) => (j === i ? e.target.value : m)))}
              rows={several ? 4 : 5}
              className="text-base leading-relaxed"
            />
            <WhatsAppSendButton
              recipient={{ studentId, studentName, parentName: r.parentName, phone: r.phone }}
              type={type}
              message={messages[i]}
              feeRecordId={feeRecordId}
              onOpened={() => {
                const next = opened.map((o, j) => o || j === i);
                setOpened(next);
                toast.success(`Opening WhatsApp${several ? ` for ${r.label?.toLowerCase() ?? "parent"}` : ""}… logged`);
                if (next.every(Boolean)) setOpen(false);
              }}
            >
              {opened[i] ? (
                <>
                  <Check aria-hidden /> Opened · open again
                </>
              ) : several ? (
                `Open WhatsApp · ${r.label ?? "Parent"}`
              ) : (
                "Open WhatsApp"
              )}
            </WhatsAppSendButton>
          </div>
        ))}
        <p className="text-sm text-muted-foreground">
          You can change the message. WhatsApp opens with it ready. Just tap Send there.
        </p>
      </SheetContent>
    </Sheet>
  );
}
