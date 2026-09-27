"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight, CircleAlert, Mail } from "lucide-react";
import { FormField } from "@/components/shared/form-field";
import { SubmitButton } from "@/components/shared/submit-button";
import { IconInput } from "@/components/auth/icon-input";
import { PasswordInput } from "@/components/auth/password-input";
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

      <div className="grid gap-1">
        <FormField label="Password" htmlFor="password" error={state?.fieldErrors?.password}>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="Your password"
            aria-invalid={Boolean(state?.fieldErrors?.password)}
            className="h-14"
            required
          />
        </FormField>
        <Link
          href="/forgot-password"
          className="justify-self-end py-1.5 text-[0.95rem] font-semibold text-primary underline-offset-4 hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <SubmitButton
        pending={pending}
        pendingText="Logging in…"
        className="mt-1 h-14 bg-linear-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500"
      >
        Log in <ArrowRight aria-hidden />
      </SubmitButton>
    </form>
  );
}
