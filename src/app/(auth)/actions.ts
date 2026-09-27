"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { type ActionState, formValues, invalid } from "@/lib/action-state";
import { normalizeIndianPhone } from "@/lib/phone";

const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error, formData);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    const unconfirmed = error.code === "email_not_confirmed";
    return {
      ok: false,
      message: unconfirmed
        ? "Please confirm your email first. Check your inbox for our link."
        : "Wrong email or password. Please try again.",
      values: { email: parsed.data.email },
    };
  }

  redirect("/");
}

const signupSchema = z.object({
  centre_name: z.string().trim().min(2, "Enter your centre's name").max(120),
  phone: z
    .string()
    .trim()
    .refine((v) => normalizeIndianPhone(v) !== null, "Enter a valid 10-digit mobile number"),
  address: z.string().trim().max(300).default(""),
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters"),
});

export async function signup(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const state = invalid(parsed.error, formData);
    delete state?.values?.password;
    return state;
  }

  const { email, password, centre_name, phone, address } = parsed.data;
  const origin = (await headers()).get("origin") ?? "";

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Picked up by the database trigger that creates the centre
      data: { centre_name, phone: normalizeIndianPhone(phone), address },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    const values = formValues(formData);
    delete values.password;
    return {
      ok: false,
      message:
        error.code === "user_already_exists"
          ? "An account with this email already exists. Try logging in."
          : error.message,
      values,
    };
  }

  // Email confirmation is turned off in Supabase -> already logged in
  if (data.session) redirect("/");

  return {
    ok: true,
    message: `We sent a confirmation link to ${email}. Open it to start using TuitionDesk.`,
  };
}

const forgotSchema = z.object({ email: z.email("Enter a valid email address") });

/** Emails a "reset your password" link. Always says "sent" so nobody can check which emails have accounts. */
export async function sendResetLink(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = forgotSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error, formData);

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    // The link logs them in, then opens the "choose a new password" page
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error?.status === 429) {
    return { ok: false, message: "Too many tries. Please wait a minute and try again.", values: parsed.data };
  }
  return {
    ok: true,
    message: `If ${parsed.data.email} has an account, a reset link is on its way. Check your inbox (and spam).`,
  };
}

const resetSchema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "The two passwords don't match" });

/** Saves the new password for the owner who opened the reset link. */
export async function resetPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Please check the highlighted fields.", fieldErrors: invalid(parsed.error, formData)?.fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return {
      ok: false,
      message:
        error.code === "same_password"
          ? "That's your current password. Please choose a new one."
          : "Could not change the password. Please open the reset link again.",
    };
  }

  redirect("/?password=changed");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
