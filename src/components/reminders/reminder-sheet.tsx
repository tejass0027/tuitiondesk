"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MessageCircle, Send } from "lucide-react";
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

/** Editable message preview in a bottom sheet, opened by a "Remind" style button. */
export function ReminderSheet({
  recipient,
  type,
  initialMessage,
  feeRecordId,
  title,
  triggerLabel = "Remind",
  triggerVariant = "outline",
  triggerSize = "sm",
  triggerClassName,
}: {
  recipient: Recipient;
  type: ReminderType;
  initialMessage: string;
  feeRecordId?: string | null;
  title: string;
  triggerLabel?: string;
  triggerVariant?: "outline" | "secondary" | "default";
  triggerSize?: "sm" | "default" | "lg";
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(initialMessage);

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setMessage(initialMessage); // start fresh each time
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
            To {recipient.parentName || `${recipient.studentName}'s parent`} · {formatPhone(recipient.phone)}
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-2 pt-2">
          <label htmlFor="reminder-message" className="text-base font-semibold">
            Message
          </label>
          <Textarea
            id="reminder-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="text-base leading-relaxed"
          />
          <p className="text-sm text-muted-foreground">
            You can change the message. WhatsApp opens with it ready. Just tap Send there.
          </p>
        </div>

        <WhatsAppSendButton
          recipient={recipient}
          type={type}
          message={message}
          feeRecordId={feeRecordId}
          onOpened={() => {
            toast.success("Opening WhatsApp… reminder logged");
            setOpen(false);
          }}
        />
      </SheetContent>
    </Sheet>
  );
}
