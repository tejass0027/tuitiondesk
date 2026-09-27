"use client";

import { useActionState } from "react";
import { CircleAlert, Mail, MailCheck, Send } from "lucide-react";
import { FormField } from "@/components/shared/form-field";
import { SubmitButton } from "@/components/shared/submit-button";
import { IconInput } from "@/components/auth/icon-input";
import { sendResetLink } from "../actions";

export function ForgotForm() {
  const [state, formAction, pending] = useActionState(sendResetLink, null);

  if (state?.ok) {
    return (
      <div role="status" className="grid justify-items-center gap-3 rounded-2xl bg-success-soft p-6 text-center">
        <MailCheck className="size-12 text-success" aria-hidden />
        <p className="text-lg font-semibold">Check your email</p>
        <p className="text-base text-muted-foreground">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-5" noValidate>
      {state?.message && !state.fieldErrors && (
        <p role="alert" className="flex items-start gap-2.5 rounded-xl bg-danger-soft p-4 text-base font-medium text-danger">
          <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
          {state.message}
        </p>
      )}
      <FormField label="Email" htmlFor="email" error={state?.fieldErrors?.email}>
        <IconInput
          icon={Mail}
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          defaultValue={state?.values?.email}
          aria-invalid={Boolean(state?.fieldErrors?.email)}
          className="h-14"
          required
        />
      </FormField>
      <SubmitButton
        pending={pending}
        pendingText="Sending…"
        className="h-14 bg-linear-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500"
      >
        Send reset link <Send aria-hidden />
      </SubmitButton>
    </form>
  );
}
