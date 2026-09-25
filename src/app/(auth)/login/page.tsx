import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

const ERRORS: Record<string, string> = {
  "link-expired": "That link has expired or was already used. Please log in.",
  "no-centre": "We couldn't find your centre. Please log in again.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  const errorMessage = typeof error === "string" ? ERRORS[error] : undefined;

  return (
    <div className="grid gap-8">
      <div className="grid gap-2">
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="text-lg text-muted-foreground">Log in to manage your centre.</p>
      </div>

      <LoginForm initialError={errorMessage} />

      <p className="text-center text-base text-muted-foreground">
        New to TuitionDesk?{" "}
        <Link href="/signup" className="font-semibold text-primary underline-offset-4 hover:underline">
          Create your centre
        </Link>
      </p>
    </div>
  );
}
