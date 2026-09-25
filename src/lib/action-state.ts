import type { z } from "zod";

/**
 * What every form Server Action returns to its form.
 * - ok: did it work?
 * - message: shown as a toast / error line
 * - fieldErrors: shown under each input
 * - values: what the user typed, so the form doesn't clear on error
 */
export type ActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
  /** id of a created/updated row, when the form needs it */
  id?: string;
} | null;

/** FormData -> plain object of strings (for re-filling the form). */
export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string" && !key.startsWith("$ACTION")) values[key] = value;
  });
  return values;
}

/** Turns a failed zod parse into an ActionState the form can display. */
export function invalid(error: z.ZodError, formData: FormData): ActionState {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return {
    ok: false,
    message: "Please check the highlighted fields.",
    fieldErrors,
    values: formValues(formData),
  };
}
