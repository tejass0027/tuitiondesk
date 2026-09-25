"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { NativeSelect } from "@/components/shared/native-select";
import { SubmitButton } from "@/components/shared/submit-button";
import { useActionToast } from "@/hooks/use-action-toast";
import { todayIST } from "@/lib/format";
import { formatMarks } from "@/lib/marks";
import type { ActionState } from "@/lib/action-state";
import type { Batch, Test } from "@/types/database";

type TestFormProps = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  batches: Pick<Batch, "id" | "name">[];
  test?: Test;
  defaultBatchId?: string;
  submitLabel: string;
};

const QUICK_MAX = [20, 25, 50, 80, 100];

/** Shared by "New test" and "Edit test". */
export function TestForm({ action, batches, test, defaultBatchId, submitLabel }: TestFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, null);
  useActionToast(state, (s) => router.push(`/tests/${s.id}`));

  const errors = state?.fieldErrors;
  const typed = state?.ok === false ? state.values : undefined;
  const initialBatch = test?.batch_id ?? defaultBatchId ?? (batches.length === 1 ? batches[0].id : "");

  return (
    <form action={formAction} className="grid gap-5" noValidate>
      <FormField label="Batch" htmlFor="batch_id" error={errors?.batch_id}>
        <NativeSelect
          id="batch_id"
          name="batch_id"
          defaultValue={typed?.batch_id ?? initialBatch}
          aria-invalid={Boolean(errors?.batch_id)}
          required
        >
          <option value="" disabled>
            Choose a batch…
          </option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </NativeSelect>
      </FormField>

      <FormField label="Test name" htmlFor="name" error={errors?.name}>
        <Input
          id="name"
          name="name"
          placeholder="e.g. Unit Test 1"
          defaultValue={typed?.name ?? test?.name}
          aria-invalid={Boolean(errors?.name)}
          required
        />
      </FormField>

      <FormField label="Subject / chapter" htmlFor="subject" error={errors?.subject} hint="Optional">
        <Input id="subject" name="subject" placeholder="e.g. Algebra" defaultValue={typed?.subject ?? test?.subject} />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Date" htmlFor="test_date" error={errors?.test_date}>
          <Input
            id="test_date"
            name="test_date"
            type="date"
            max={todayIST()}
            defaultValue={typed?.test_date ?? test?.test_date ?? todayIST()}
            aria-invalid={Boolean(errors?.test_date)}
            required
          />
        </FormField>
        <FormField label="Out of (max marks)" htmlFor="max_marks" error={errors?.max_marks}>
          <Input
            id="max_marks"
            name="max_marks"
            inputMode="decimal"
            placeholder="50"
            list="max-marks-options"
            className="text-lg font-semibold"
            defaultValue={typed?.max_marks ?? (test ? formatMarks(test.max_marks) : "")}
            aria-invalid={Boolean(errors?.max_marks)}
            required
          />
          <datalist id="max-marks-options">
            {QUICK_MAX.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </FormField>
      </div>

      <SubmitButton pending={pending} className="mt-2">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
