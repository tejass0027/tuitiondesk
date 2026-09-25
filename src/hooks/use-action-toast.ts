"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import type { ActionState } from "@/lib/action-state";

/**
 * Shows a toast every time a Server Action finishes:
 * green on success, red on failure. Each result is a new object,
 * so saving twice with the same message still shows two toasts.
 */
export function useActionToast(state: ActionState, onSuccess?: (state: NonNullable<ActionState>) => void) {
  useEffect(() => {
    if (!state?.message) return;
    if (state.ok) {
      toast.success(state.message);
      onSuccess?.(state);
    } else {
      toast.error(state.message);
    }
    // only react to a new result, not to a new onSuccess function
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
}
