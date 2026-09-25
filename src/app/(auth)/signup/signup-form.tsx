"use client";

import { useActionState } from "react";
import { ArrowRight, Building2, CircleAlert, Mail, MailCheck, MapPin, Phone } from "lucide-react";
import { FormField } from "@/components/shared/form-field";
import { SubmitButton } from "@/components/shared/submit-button";
import { IconInput } from "@/components/auth/icon-input";
import { PasswordInput } from "@/components/auth/password-input";
import { signup } from "../actions";

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, null);
  const errors = state?.fieldErrors;
  const values = state?.values;

  // Email confirmation is on: show a friendly "check your inbox" card
  if (state?.ok) {
    return (
      <div className="grid justify-items-center gap-4 rounded-3xl bg-success-soft p-8 text-center ring-1 ring-success/20">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-card shadow-sm">
          <MailCheck className="size-9 text-success" aria-hidden />
        </span>
        <h2 className="text-2xl font-bold">Check your email</h2>
        <p className="text-lg">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-6" noValidate>
      {state?.message && !errors && (
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-xl bg-danger-soft p-4 text-base font-medium text-danger"
        >
          <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
          {state.message}
        </p>
      )}

      <fieldset className="grid gap-4">
        <legend className="mb-3 flex items-center gap-2 text-sm font-bold tracking-wider text-muted-foreground uppercase">
          <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
            1
          </span>
          Your centre
        </legend>

        <FormField label="Centre name" htmlFor="centre_name" error={errors?.centre_name}>
          <IconInput
            icon={Building2}
            id="centre_name"
            name="centre_name"
            placeholder="e.g. Sharma Tuition Classes"
            autoComplete="organization"
            defaultValue={values?.centre_name}
            aria-invalid={Boolean(errors?.centre_name)}
            className="h-14"
            required
          />
        </FormField>

        <FormField label="Mobile number" htmlFor="phone" error={errors?.phone}>
          <IconInput
            icon={Phone}
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="98765 43210"
            defaultValue={values?.phone}
            aria-invalid={Boolean(errors?.phone)}
            className="h-14"
            required
          />
        </FormField>

        <FormField label="Address" htmlFor="address" error={errors?.address} hint="Optional. Shown on report cards.">
          <IconInput
            icon={MapPin}
            id="address"
            name="address"
            autoComplete="street-address"
            placeholder="Street, area, city"
            defaultValue={values?.address}
            className="h-14"
          />
        </FormField>
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-3 flex items-center gap-2 text-sm font-bold tracking-wider text-muted-foreground uppercase">
          <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
            2
          </span>
          Your login
        </legend>

        <FormField label="Email" htmlFor="email" error={errors?.email}>
          <IconInput
            icon={Mail}
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            defaultValue={values?.email}
            aria-invalid={Boolean(errors?.email)}
            className="h-14"
            required
          />
        </FormField>

        <FormField label="Password" htmlFor="password" error={errors?.password} hint="At least 8 characters">
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            placeholder="Create a password"
            aria-invalid={Boolean(errors?.password)}
            className="h-14"
            required
          />
        </FormField>
      </fieldset>

      <SubmitButton
        pending={pending}
        pendingText="Creating your centre…"
        className="h-14 bg-linear-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500"
      >
        Create my centre <ArrowRight aria-hidden />
      </SubmitButton>
    </form>
  );
}
