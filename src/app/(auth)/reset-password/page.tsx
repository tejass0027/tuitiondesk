import type { Metadata } from "next";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "New password" };

/** Opened from the reset email (the link already logged the owner in). */
export default function ResetPasswordPage() {
  return (
    <div className="grid gap-8">
      <div className="grid gap-2">
        <p className="text-sm font-semibold tracking-wider text-primary uppercase">Almost done</p>
        <h1 className="text-[2rem] leading-tight font-extrabold tracking-tight">Choose a new password</h1>
        <p className="text-lg text-muted-foreground">
          Use at least 8 characters. You&apos;ll use it to log in from now on.
        </p>
      </div>
      <ResetForm />
    </div>
  );
}
