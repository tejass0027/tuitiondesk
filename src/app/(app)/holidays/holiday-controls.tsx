"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { CalendarPlus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { SubmitButton } from "@/components/shared/submit-button";
import { useActionToast } from "@/hooks/use-action-toast";
import { addHolidays, deleteHolidays } from "./actions";

const IDEAS = ["Diwali", "Dussehra", "Holi", "Ganesh Chaturthi", "Eid", "Christmas", "Pongal", "Exam break"];

/** Date (or range) + name. Everything else on the page updates when it's saved. */
export function AddHolidayForm({ today }: { today: string }) {
  const [state, formAction, pending] = useActionState(addHolidays, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [from, setFrom] = useState(today);
  const [name, setName] = useState("");
  const [range, setRange] = useState(false);
  useActionToast(state, () => {
    setName("");
    setRange(false);
  });
  const errors = state?.fieldErrors;

  return (
    <form
      ref={formRef}
      action={formAction}
      noValidate
      className="grid gap-4 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/8"
    >
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <CalendarPlus className="size-5 text-primary" aria-hidden /> Add a holiday
      </h2>

      <FormField label="Name" htmlFor="holiday-name" error={errors?.name}>
        <Input
          id="holiday-name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Diwali"
          maxLength={80}
          aria-invalid={Boolean(errors?.name)}
          className="h-12 text-base"
        />
        <div className="-mx-1 flex flex-wrap gap-1.5">
          {IDEAS.map((idea) => (
            <button
              key={idea}
              type="button"
              onClick={() => setName(idea)}
              className="rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {idea}
            </button>
          ))}
        </div>
      </FormField>

      <div className={range ? "grid grid-cols-2 gap-3" : "grid gap-3"}>
        <FormField label={range ? "From" : "Date"} htmlFor="holiday-from" error={errors?.from}>
          <Input
            id="holiday-from"
            name="from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-12 text-base"
          />
        </FormField>
        {range && (
          <FormField label="To" htmlFor="holiday-to" error={errors?.to}>
            <Input id="holiday-to" name="to" type="date" min={from} defaultValue={from} className="h-12 text-base" />
          </FormField>
        )}
      </div>
      {!range && (
        <Button type="button" variant="ghost" size="sm" onClick={() => setRange(true)} className="justify-self-start">
          + More than one day (a break)
        </Button>
      )}

      <SubmitButton pending={pending} pendingText="Adding…">
        <CalendarPlus aria-hidden /> Add holiday
      </SubmitButton>
    </form>
  );
}

export function DeleteHolidayButton({ ids, label }: { ids: string[]; label: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={pending}
      aria-label={`Remove ${label}`}
      onClick={() =>
        startTransition(async () => {
          const res = await deleteHolidays(ids);
          if (res?.ok) toast.success(res.message);
          else toast.error(res?.message ?? "Could not remove");
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Trash2 className="text-muted-foreground" aria-hidden />}
    </Button>
  );
}
