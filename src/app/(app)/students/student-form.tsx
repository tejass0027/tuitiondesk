"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { FormField } from "@/components/shared/form-field";
import { NativeSelect } from "@/components/shared/native-select";
import { SubmitButton } from "@/components/shared/submit-button";
import { useActionToast } from "@/hooks/use-action-toast";
import { formatINR, todayIST } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import type { ActionState } from "@/lib/action-state";
import type { Batch, Student } from "@/types/database";

type StudentFormProps = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  batches: Pick<Batch, "id" | "name" | "monthly_fee">[];
  student?: Student;
  defaultBatchId?: string;
  submitLabel: string;
};

/** Shared by "Add student" and "Edit student". */
export function StudentForm({ action, batches, student, defaultBatchId, submitLabel }: StudentFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, null);
  useActionToast(state, (s) => router.push(`/students/${s.id}`));

  const errors = state?.fieldErrors;
  const typed = state?.ok === false ? state.values : undefined;

  const initialBatchId = student?.batch_id ?? defaultBatchId ?? (batches.length === 1 ? batches[0].id : "");
  const [batchId, setBatchId] = useState(initialBatchId);
  const batchFee = (id: string) => batches.find((b) => b.id === id)?.monthly_fee;
  const [fee, setFee] = useState(() =>
    student ? String(student.monthly_fee) : String(batchFee(initialBatchId) ?? ""),
  );

  // Picking a batch fills in its fee; the owner can still lower it for a discount
  function onBatchChange(id: string) {
    setBatchId(id);
    const f = batchFee(id);
    if (f !== undefined) setFee(String(f));
  }

  const selectedBatchFee = batchFee(batchId);
  const isDiscounted = selectedBatchFee !== undefined && fee !== "" && Number(fee) < selectedBatchFee;

  return (
    <form action={formAction} className="grid gap-5" noValidate>
      <FormField label="Student name" htmlFor="name" error={errors?.name}>
        <Input
          id="name"
          name="name"
          autoComplete="off"
          autoCapitalize="words"
          placeholder="e.g. Aarav Sharma"
          defaultValue={typed?.name ?? student?.name}
          aria-invalid={Boolean(errors?.name)}
          required
        />
      </FormField>

      <div className="grid grid-cols-[7rem_1fr] gap-3">
        <FormField label="Class" htmlFor="class" error={errors?.class}>
          <Input
            id="class"
            name="class"
            placeholder="10th"
            defaultValue={typed?.class ?? student?.class}
          />
        </FormField>
        <FormField label="Batch" htmlFor="batch_id" error={errors?.batch_id}>
          <NativeSelect
            id="batch_id"
            name="batch_id"
            value={batchId}
            onChange={(e) => onBatchChange(e.target.value)}
            aria-invalid={Boolean(errors?.batch_id)}
            required
          >
            <option value="" disabled>
              Choose…
            </option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </NativeSelect>
        </FormField>
      </div>

      <FormField
        label="Monthly fee (₹)"
        htmlFor="monthly_fee"
        error={errors?.monthly_fee}
        hint={
          selectedBatchFee === undefined
            ? "Pick a batch to fill in its fee."
            : isDiscounted
              ? `Discount: batch fee is ${formatINR(selectedBatchFee)}`
              : "Same as the batch fee. Lower it to give a discount."
        }
      >
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-lg font-semibold text-muted-foreground">
            ₹
          </span>
          <Input
            id="monthly_fee"
            name="monthly_fee"
            inputMode="decimal"
            className="pl-9 text-lg font-semibold"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            aria-invalid={Boolean(errors?.monthly_fee)}
            required
          />
        </div>
      </FormField>

      <FormField label="Joining date" htmlFor="joining_date" error={errors?.joining_date}>
        <Input
          id="joining_date"
          name="joining_date"
          type="date"
          max={todayIST()}
          defaultValue={typed?.joining_date ?? student?.joining_date ?? todayIST()}
          aria-invalid={Boolean(errors?.joining_date)}
          required
        />
      </FormField>

      <Separator className="my-1" />

      <FormField label="Parent's name" htmlFor="parent_name" error={errors?.parent_name}>
        <Input
          id="parent_name"
          name="parent_name"
          autoComplete="off"
          autoCapitalize="words"
          placeholder="e.g. Rajesh Sharma"
          defaultValue={typed?.parent_name ?? student?.parent_name}
        />
      </FormField>

      <FormField
        label="Parent's WhatsApp number"
        htmlFor="parent_whatsapp"
        error={errors?.parent_whatsapp}
        hint="Fee and absence reminders are sent here."
      >
        <Input
          id="parent_whatsapp"
          name="parent_whatsapp"
          type="tel"
          inputMode="tel"
          autoComplete="off"
          placeholder="98765 43210"
          defaultValue={
            typed?.parent_whatsapp ?? (student ? formatPhone(student.parent_whatsapp) : undefined)
          }
          aria-invalid={Boolean(errors?.parent_whatsapp)}
          required
        />
      </FormField>

      <SubmitButton pending={pending} className="mt-2">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
