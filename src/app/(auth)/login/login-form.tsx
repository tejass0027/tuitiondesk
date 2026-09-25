"use client";

import { useActionState } from "react";
import { CircleAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { SubmitButton } from "@/components/shared/submit-button";
import { login } from "../actions";

export function LoginForm({ initialError }: { initialError?: string }) {
  const [state, formAction, pending] = useActionState(login, null);
  const error = state?.message ?? initialError;

  return (
    <form action={formAction} className="grid gap-5" noValidate>
      {error && !state?.fieldErrors && (
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-xl bg-danger-soft p-4 text-base font-medium text-danger"
        >
          <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <FormField label="Email" htmlFor="email" error={state?.fieldErrors?.email}>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          defaultValue={state?.values?.email}
          aria-invalid={Boolean(state?.fieldErrors?.email)}
          required
        />
      </FormField>

      <FormField label="Password" htmlFor="password" error={state?.fieldErrors?.password}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(state?.fieldErrors?.password)}
          required
        />
      </FormField>

      <SubmitButton pending={pending} pendingText="Logging in…" className="mt-2">
        Log in
      </SubmitButton>
    </form>
  );
}
