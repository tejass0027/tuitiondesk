import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

const ERRORS: Record<string, string> = {
  "link-expired": "That link has expired or was already used. Please log in.",
  "no-centre": "We couldn't find your centre. Please log in again.",
  "reset-expired": "That reset link has expired or was already used. Tap “Forgot password?” to get a new one.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  const errorMessage = typeof error === "string" ? ERRORS[error] : undefined;

  return (
    <div className="grid gap-8">
      <div className="grid gap-2">
        <p className="text-sm font-semibold tracking-wider text-primary uppercase">Welcome back 👋</p>
        <h1 className="text-[2rem] leading-tight font-extrabold tracking-tight">Log in to your centre</h1>
        <p className="text-lg text-muted-foreground">Pick up right where you left off.</p>
      </div>

      <LoginForm initialError={errorMessage} />

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        New to TuitionDesk?
        <span className="h-px flex-1 bg-border" />
      </div>

      <Link
        href="/signup"
        className="group flex h-14 items-center justify-center gap-2 rounded-xl border-2 border-primary/25 bg-accent/60 text-lg font-semibold text-accent-foreground transition-colors hover:border-primary/50 hover:bg-accent"
      >
        Create your centre, it’s free
        <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </div>
  );
}
