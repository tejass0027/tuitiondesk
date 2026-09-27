"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, Copy, ExternalLink, Link2, Link2Off, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ReminderSheet, type SheetRecipient } from "@/components/reminders/reminder-sheet";
import { createParentLink, turnOffParentLink } from "../actions";

/**
 * A private, read-only page for the parents: attendance, marks and fees.
 * Create it once, send it on WhatsApp, turn it off any time.
 */
export function ParentLinkCard({
  studentId,
  studentName,
  url,
  recipients,
}: {
  studentId: string;
  studentName: string;
  url: string | null;
  recipients: SheetRecipient[];
}) {
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  function run(action: typeof createParentLink) {
    startTransition(async () => {
      const res = await action(studentId);
      if (res?.ok) toast.success(res.message);
      else toast.error(res?.message ?? "Something went wrong");
    });
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy. Long-press the link to copy it.");
    }
  }

  return (
    <section className="mt-4 grid gap-3 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/8">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Link2 className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold">Parent link</h2>
          <p className="text-[0.95rem] text-muted-foreground">
            {url
              ? "Parents can open this any time to see attendance, marks and fees. No login needed."
              : `Give ${studentName}'s parents a private page with attendance, marks and fees. No login or app needed.`}
          </p>
        </div>
      </div>

      {!url ? (
        <Button size="lg" onClick={() => run(createParentLink)} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Link2 aria-hidden />} Create parent link
        </Button>
      ) : (
        <>
          <p className="truncate rounded-xl bg-muted px-3 py-2.5 font-mono text-sm" title={url}>
            {url}
          </p>
          {recipients.length > 0 && (
            <ReminderSheet
              title="Send the parent link"
              type="custom"
              triggerLabel="Send on WhatsApp"
              triggerVariant="default"
              triggerSize="lg"
              triggerClassName="w-full bg-[#1f9d55] text-white hover:bg-[#1a8a4a]"
              studentId={studentId}
              studentName={studentName}
              recipients={recipients}
            />
          )}
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" onClick={copy}>
              {copied ? <Check aria-hidden /> : <Copy aria-hidden />} {copied ? "Copied" : "Copy"}
            </Button>
            <Button asChild variant="outline">
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink aria-hidden /> Open
              </a>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={pending} className="text-danger hover:text-danger">
                  {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Link2Off aria-hidden />} Turn off
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Turn off the parent link?</AlertDialogTitle>
                  <AlertDialogDescription>
                    The link you shared will stop working at once. You can create a new link later.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep it</AlertDialogCancel>
                  <AlertDialogAction variant="danger" onClick={() => run(turnOffParentLink)}>
                    Turn off
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </>
      )}
    </section>
  );
}
