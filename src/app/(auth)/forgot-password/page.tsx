import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div className="grid gap-8">
      <div className="grid gap-2">
        <p className="text-sm font-semibold tracking-wider text-primary uppercase">No problem 🔑</p>
        <h1 className="text-[2rem] leading-tight font-extrabold tracking-tight">Forgot your password?</h1>
        <p className="text-lg text-muted-foreground">
          Type your email and we&apos;ll send you a link to choose a new one.
        </p>
      </div>

      <ForgotForm />

      <Link
        href="/login"
        className="inline-flex items-center justify-center gap-2 text-base font-semibold text-primary underline-offset-4 hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden /> Back to log in
      </Link>
    </div>
  );
}
