"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/shared/form-field";
import { SubmitButton } from "@/components/shared/submit-button";
import { useActionToast } from "@/hooks/use-action-toast";
import { formatPhone } from "@/lib/phone";
import type { Centre } from "@/types/database";
import { updateCentre } from "./actions";

export function CentreForm({ centre }: { centre: Centre }) {
  const [state, formAction, pending] = useActionState(updateCentre, null);
  useActionToast(state);

  const errors = state?.fieldErrors;
  // after a failed save show what was typed; otherwise the saved values
  const v = state?.ok === false && state.values ? state.values : undefined;

  return (
    <form action={formAction} className="grid gap-5" noValidate>
      <FormField label="Centre name" htmlFor="name" error={errors?.name}>
        <Input id="name" name="name" defaultValue={v?.name ?? centre.name} required />
      </FormField>

      <FormField label="Mobile number" htmlFor="phone" error={errors?.phone}>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          defaultValue={v?.phone ?? (centre.phone ? formatPhone(centre.phone) : "")}
          required
        />
      </FormField>

      <FormField label="Address" htmlFor="address" error={errors?.address}>
        <Textarea id="address" name="address" rows={2} defaultValue={v?.address ?? centre.address} />
      </FormField>

      <FormField
        label="Fee due day"
        htmlFor="fee_due_day"
        error={errors?.fee_due_day}
        hint="Fees not paid by this day of the month are shown as overdue."
      >
        <Input
          id="fee_due_day"
          name="fee_due_day"
          type="number"
          inputMode="numeric"
          min={1}
          max={28}
          className="w-32"
          defaultValue={v?.fee_due_day ?? centre.fee_due_day}
          required
        />
      </FormField>

      <SubmitButton pending={pending} className="mt-2">
        Save changes
      </SubmitButton>
    </form>
  );
}
