"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { SubmitButton } from "@/components/shared/submit-button";
import { useActionToast } from "@/hooks/use-action-toast";
import { WEEK_DAYS } from "@/lib/batches";
import type { ActionState } from "@/lib/action-state";
import type { Batch } from "@/types/database";

type BatchFormProps = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  batch?: Batch;
  submitLabel: string;
};

/** Shared by "Add batch" and "Edit batch". */
export function BatchForm({ action, batch, submitLabel }: BatchFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, null);
  useActionToast(state, () => router.push("/batches"));

  const errors = state?.fieldErrors;
  const typed = state?.ok === false ? state.values : undefined;
  // After a failed save, keep the days the owner had ticked
  const typedDays = typed ? (typed.days?.split(",") ?? []) : undefined;
  const selectedDays = typedDays ?? batch?.days ?? [];

  return (
    <form action={formAction} className="grid gap-6" noValidate>
      <FormField label="Batch name" htmlFor="name" error={errors?.name}>
        <Input
          id="name"
          name="name"
          placeholder="e.g. Class 10 Maths – Evening"
          defaultValue={typed?.name ?? batch?.name}
          aria-invalid={Boolean(errors?.name)}
          required
        />
      </FormField>

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-base font-semibold">Days</legend>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {WEEK_DAYS.map((day) => (
            <label key={day.key} className="relative">
              <input
                type="checkbox"
                name="days"
                value={day.key}
                defaultChecked={selectedDays.includes(day.key)}
                className="peer sr-only"
              />
              <span
                title={day.label}
                className="flex h-12 cursor-pointer items-center justify-center rounded-xl border-2 border-input bg-card text-base font-semibold text-muted-foreground transition-colors select-none peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50"
              >
                {day.short}
              </span>
            </label>
          ))}
        </div>
        {errors?.days && (
          <p className="text-sm font-medium text-danger" role="alert">
            {errors.days[0]}
          </p>
        )}
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Starts at" htmlFor="start_time" error={errors?.start_time}>
          <Input
            id="start_time"
            name="start_time"
            type="time"
            defaultValue={typed?.start_time ?? batch?.start_time?.slice(0, 5) ?? ""}
          />
        </FormField>
        <FormField label="Ends at" htmlFor="end_time" error={errors?.end_time}>
          <Input
            id="end_time"
            name="end_time"
            type="time"
            defaultValue={typed?.end_time ?? batch?.end_time?.slice(0, 5) ?? ""}
            aria-invalid={Boolean(errors?.end_time)}
          />
        </FormField>
      </div>

      <FormField
        label="Monthly fee (₹)"
        htmlFor="monthly_fee"
        error={errors?.monthly_fee}
        hint="New students in this batch get this fee. You can change it per student."
      >
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-lg font-semibold text-muted-foreground">
            ₹
          </span>
          <Input
            id="monthly_fee"
            name="monthly_fee"
            inputMode="decimal"
            placeholder="1500"
            className="pl-9 text-lg font-semibold"
            defaultValue={typed?.monthly_fee ?? (batch ? String(batch.monthly_fee) : "")}
            aria-invalid={Boolean(errors?.monthly_fee)}
            required
          />
        </div>
      </FormField>

      <SubmitButton pending={pending} className="mt-2">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
