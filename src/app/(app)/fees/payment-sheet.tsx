"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Banknote, IndianRupee, Landmark, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FormField } from "@/components/shared/form-field";
import { SubmitButton } from "@/components/shared/submit-button";
import { formatINR, formatMonth, todayIST } from "@/lib/format";
import { PAYMENT_MODES } from "@/lib/fees";
import { cn } from "@/lib/utils";
import type { PaymentMode } from "@/types/database";
import { deletePayment, recordPayment } from "./actions";

export type PayableFee = {
  id: string;
  student_name: string;
  month: string;
  amount_due: number;
  amount_paid: number;
  balance: number;
};

const MODE_ICONS: Record<PaymentMode, typeof Banknote> = {
  cash: Banknote,
  upi: Smartphone,
  bank_transfer: Landmark,
};

/** "Record payment" button that opens a bottom sheet with the payment form. */
export function PaymentSheet({
  fee,
  triggerLabel = "Record payment",
  triggerClassName,
}: {
  fee: PayableFee;
  triggerLabel?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className={triggerClassName}>
          <IndianRupee aria-hidden /> {triggerLabel}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="mx-auto max-h-[92dvh] max-w-lg overflow-y-auto rounded-t-3xl px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <SheetHeader className="px-0 pb-0">
          <SheetTitle className="text-2xl font-bold">{fee.student_name}</SheetTitle>
          <SheetDescription className="text-base">
            {formatMonth(fee.month)} · Balance <strong className="text-foreground">{formatINR(fee.balance)}</strong>
            {Number(fee.amount_paid) > 0 && <> (paid {formatINR(fee.amount_paid)} of {formatINR(fee.amount_due)})</>}
          </SheetDescription>
        </SheetHeader>
        {/* mounted only while open, so the form starts fresh each time */}
        {open && <PaymentForm fee={fee} onDone={() => setOpen(false)} />}
      </SheetContent>
    </Sheet>
  );
}

function PaymentForm({ fee, onDone }: { fee: PayableFee; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(recordPayment.bind(null, fee.id), null);
  const balance = Number(fee.balance);
  const [amount, setAmount] = useState(String(balance));
  const [mode, setMode] = useState<PaymentMode>("cash");
  const errors = state?.fieldErrors;

  useEffect(() => {
    if (!state) return;
    if (!state.ok) {
      toast.error(state.message);
      return;
    }
    const paymentId = state.id;
    toast.success(state.message, {
      action: paymentId
        ? {
            label: "Undo",
            onClick: async () => {
              const undo = await deletePayment(paymentId);
              if (undo?.ok) toast.success(undo.message);
              else toast.error(undo?.message ?? "Could not undo");
            },
          }
        : undefined,
      duration: 8000,
    });
    onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const half = Math.round(balance / 2);

  return (
    <form action={formAction} className="grid gap-5 pt-2" noValidate>
      <FormField label="Amount received (₹)" htmlFor="amount" error={errors?.amount}>
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-2xl font-bold text-muted-foreground">
            ₹
          </span>
          <Input
            id="amount"
            name="amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-16 pl-10 text-2xl font-bold"
            aria-invalid={Boolean(errors?.amount)}
            required
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <QuickAmount label={`Full ${formatINR(balance)}`} onClick={() => setAmount(String(balance))} />
          {half > 0 && half < balance && (
            <QuickAmount label={`Half ${formatINR(half)}`} onClick={() => setAmount(String(half))} />
          )}
        </div>
      </FormField>

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-base font-semibold">Paid by</legend>
        <div className="grid grid-cols-3 gap-2">
          {PAYMENT_MODES.map(({ value, label }) => {
            const Icon = MODE_ICONS[value];
            const selected = mode === value;
            return (
              <label key={value} className="relative">
                <input
                  type="radio"
                  name="mode"
                  value={value}
                  checked={selected}
                  onChange={() => setMode(value)}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    "flex h-18 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 text-center text-[0.95rem] leading-tight font-semibold transition-colors peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
                    selected
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-input bg-card text-muted-foreground",
                  )}
                >
                  <Icon className="size-6" aria-hidden />
                  {label}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Date" htmlFor="paid_on" error={errors?.paid_on}>
          <Input id="paid_on" name="paid_on" type="date" max={todayIST()} defaultValue={todayIST()} required />
        </FormField>
        <FormField label="Note" htmlFor="note" hint="Optional">
          <Input id="note" name="note" placeholder="e.g. UPI ref" maxLength={200} />
        </FormField>
      </div>

      <SubmitButton pending={pending} pendingText="Saving payment…">
        Save payment
      </SubmitButton>
    </form>
  );
}

function QuickAmount({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button type="button" variant="secondary" size="sm" onClick={onClick}>
      {label}
    </Button>
  );
}
