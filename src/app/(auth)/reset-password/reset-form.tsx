"use client";

import { useActionState } from "react";
import { Check, CircleAlert } from "lucide-react";
import { FormField } from "@/components/shared/form-field";
import { SubmitButton } from "@/components/shared/submit-button";
import { PasswordInput } from "@/components/auth/password-input";
import { resetPassword } from "../actions";

export function ResetForm() {
  const [state, formAction, pending] = useActionState(resetPassword, null);

  return (
    <form action={formAction} className="grid gap-5" noValidate>
      {state?.message && !state.fieldErrors && (
        <p role="alert" className="flex items-start gap-2.5 rounded-xl bg-danger-soft p-4 text-base font-medium text-danger">
          <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
          {state.message}
        </p>
      )}
      <FormField label="New password" htmlFor="password" error={state?.fieldErrors?.password}>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          aria-invalid={Boolean(state?.fieldErrors?.password)}
          className="h-14"
          required
        />
      </FormField>
      <FormField label="Type it again" htmlFor="confirm" error={state?.fieldErrors?.confirm}>
        <PasswordInput
          id="confirm"
          name="confirm"
          autoComplete="new-password"
          placeholder="Same password again"
          aria-invalid={Boolean(state?.fieldErrors?.confirm)}
          className="h-14"
          required
        />
      </FormField>
      <SubmitButton
        pending={pending}
        pendingText="Saving…"
        className="h-14 bg-linear-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500"
      >
        <Check aria-hidden /> Save new password
      </SubmitButton>
    </form>
  );
}
