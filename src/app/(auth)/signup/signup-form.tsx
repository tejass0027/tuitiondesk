"use client";

import { useActionState } from "react";
import { CircleAlert, MailCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { FormField } from "@/components/shared/form-field";
import { SubmitButton } from "@/components/shared/submit-button";
import { signup } from "../actions";

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, null);
  const errors = state?.fieldErrors;
  const values = state?.values;

  // Email confirmation is on: show a friendly "check your inbox" card
  if (state?.ok) {
    return (
      <div className="grid justify-items-center gap-4 rounded-2xl bg-success-soft p-8 text-center">
        <MailCheck className="size-12 text-success" aria-hidden />
        <h2 className="text-2xl font-bold">Check your email</h2>
        <p className="text-lg">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-5" noValidate>
      {state?.message && !errors && (
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-xl bg-danger-soft p-4 text-base font-medium text-danger"
        >
          <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
          {state.message}
        </p>
      )}

      <FormField label="Centre name" htmlFor="centre_name" error={errors?.centre_name}>
        <Input
          id="centre_name"
          name="centre_name"
          placeholder="e.g. Sharma Tuition Classes"
          autoComplete="organization"
          defaultValue={values?.centre_name}
          aria-invalid={Boolean(errors?.centre_name)}
          required
        />
      </FormField>

      <FormField label="Mobile number" htmlFor="phone" error={errors?.phone}>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="98765 43210"
          defaultValue={values?.phone}
          aria-invalid={Boolean(errors?.phone)}
          required
        />
      </FormField>

      <FormField label="Address" htmlFor="address" error={errors?.address} hint="Optional">
        <Textarea
          id="address"
          name="address"
          rows={2}
          autoComplete="street-address"
          placeholder="Street, area, city"
          defaultValue={values?.address}
        />
      </FormField>

      <Separator className="my-1" />

      <FormField label="Email" htmlFor="email" error={errors?.email}>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          defaultValue={values?.email}
          aria-invalid={Boolean(errors?.email)}
          required
        />
      </FormField>

      <FormField
        label="Password"
        htmlFor="password"
        error={errors?.password}
        hint="At least 8 characters"
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors?.password)}
          required
        />
      </FormField>

      <SubmitButton pending={pending} pendingText="Creating your centre…" className="mt-2">
        Create my centre
      </SubmitButton>
    </form>
  );
}
