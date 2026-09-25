"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deletePayment } from "@/app/(app)/fees/actions";

/** Small trash button to remove a payment that was entered by mistake. */
export function RemovePaymentButton({ paymentId, description }: { paymentId: string; description: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" disabled={pending} aria-label={`Remove payment: ${description}`}>
          <Trash2 className="size-4.5 text-muted-foreground" aria-hidden />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove this payment?</AlertDialogTitle>
          <AlertDialogDescription>
            {description}. Only do this if it was entered by mistake. The fee will show as unpaid again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep it</AlertDialogCancel>
          <AlertDialogAction
            variant="danger"
            onClick={() =>
              startTransition(async () => {
                const result = await deletePayment(paymentId);
                if (result?.ok) toast.success(result.message);
                else toast.error(result?.message ?? "Could not remove the payment");
              })
            }
          >
            Remove payment
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
