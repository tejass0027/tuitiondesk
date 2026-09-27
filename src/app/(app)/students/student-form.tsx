"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { MessageCircle, Phone, User } from "lucide-react";
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
  /** The centre's class list (More → Classes). Empty = free text box. */
  classNames: string[];
  student?: Student;
  defaultBatchId?: string;
  submitLabel: string;
};

/** Shared by "Add student" and "Edit student". */
export function StudentForm({ action, batches, classNames, student, defaultBatchId, submitLabel }: StudentFormProps) {
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

      <ClassField
        classNames={classNames}
        current={typed?.class ?? student?.class ?? ""}
        error={errors?.class}
      />

      <div className="grid gap-3">
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

      <ParentFields
        who="father"
        title="Father"
        name={typed?.father_name ?? student?.father_name}
        phone={typed?.father_phone ?? (student?.father_phone ? formatPhone(student.father_phone) : undefined)}
        errors={errors}
      />
      <ParentFields
        who="mother"
        title="Mother"
        name={typed?.mother_name ?? student?.mother_name}
        phone={typed?.mother_phone ?? (student?.mother_phone ? formatPhone(student.mother_phone) : undefined)}
        errors={errors}
      />

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-base font-semibold">Send WhatsApp messages to</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["father", "mother"] as const).map((who) => (
            <label key={who} className="relative">
              <input
                type="radio"
                name="contact_parent"
                value={who}
                defaultChecked={(typed?.contact_parent ?? student?.contact_parent ?? "father") === who}
                className="peer sr-only"
              />
              <span className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-input bg-card text-base font-semibold text-muted-foreground transition-colors peer-checked:border-primary peer-checked:bg-accent peer-checked:text-accent-foreground peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50">
                <MessageCircle className="size-5" aria-hidden />
                {who === "father" ? "Father" : "Mother"}
              </span>
            </label>
          ))}
        </div>
        {errors?.contact_parent ? (
          <p className="text-sm font-medium text-danger" role="alert">
            {errors.contact_parent[0]}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Fee, absence and result messages go to this parent.</p>
        )}
      </fieldset>

      <SubmitButton pending={pending} className="mt-2">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}

/** Class picker from the centre's list, or a text box if no list is set up yet. */
function ClassField({ classNames, current, error }: { classNames: string[]; current: string; error?: string[] }) {
  if (classNames.length === 0) {
    return (
      <FormField label="Class" htmlFor="class" error={error}>
        <Input id="class" name="class" placeholder="e.g. Class 10" defaultValue={current} />
        <p className="text-sm text-muted-foreground">
          Tip:{" "}
          <Link href="/classes" className="font-semibold text-primary hover:underline">
            set up your classes
          </Link>{" "}
          once and pick from a list.
        </p>
      </FormField>
    );
  }

  // Keep a student's old class selectable even if it's no longer in the list
  const options = current && !classNames.some((n) => n.toLowerCase() === current.toLowerCase())
    ? [current, ...classNames]
    : classNames;

  return (
    <FormField label="Class" htmlFor="class" error={error}>
      <NativeSelect id="class" name="class" defaultValue={options.find((n) => n.toLowerCase() === current.toLowerCase()) ?? ""}>
        <option value="">No class</option>
        {options.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </NativeSelect>
      <Link href="/classes" className="text-sm font-semibold text-primary hover:underline">
        Add or edit classes
      </Link>
    </FormField>
  );
}

/** Name + phone for one parent, in a small card. Both are optional. */
function ParentFields({
  who,
  title,
  name,
  phone,
  errors,
}: {
  who: "father" | "mother";
  title: string;
  name?: string;
  phone?: string;
  errors?: Record<string, string[] | undefined>;
}) {
  return (
    <fieldset className="grid gap-3 rounded-2xl bg-muted/50 p-4 ring-1 ring-foreground/5">
      <legend className="sr-only">{title}</legend>
      <p className="flex items-center gap-2 text-base font-bold" aria-hidden>
        <span className="flex size-8 items-center justify-center rounded-lg bg-card text-primary shadow-sm">
          <User className="size-4.5" />
        </span>
        {title}
      </p>
      <FormField label={`${title}'s name`} htmlFor={`${who}_name`} error={errors?.[`${who}_name`]}>
        <Input
          id={`${who}_name`}
          name={`${who}_name`}
          autoComplete="off"
          autoCapitalize="words"
          placeholder={who === "father" ? "e.g. Rajesh Sharma" : "e.g. Sunita Sharma"}
          defaultValue={name}
        />
      </FormField>
      <FormField label={`${title}'s phone (WhatsApp)`} htmlFor={`${who}_phone`} error={errors?.[`${who}_phone`]}>
        <div className="relative">
          <Phone
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id={`${who}_phone`}
            name={`${who}_phone`}
            type="tel"
            inputMode="tel"
            autoComplete="off"
            placeholder="98765 43210"
            defaultValue={phone}
            aria-invalid={Boolean(errors?.[`${who}_phone`])}
            className="pl-12"
          />
        </div>
      </FormField>
    </fieldset>
  );
}
