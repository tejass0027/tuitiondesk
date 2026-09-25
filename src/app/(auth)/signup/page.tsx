import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Create your centre" };

export default function SignupPage() {
  return (
    <div className="grid gap-8">
      <div className="grid gap-2">
        <p className="text-sm font-semibold tracking-wider text-primary uppercase">Get started free</p>
        <h1 className="text-[2rem] leading-tight font-extrabold tracking-tight">Set up your centre</h1>
        <p className="text-lg text-muted-foreground">Takes less than a minute. No card needed.</p>
      </div>

      <SignupForm />

      <p className="text-center text-base text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
