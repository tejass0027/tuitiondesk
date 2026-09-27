import type { Metadata } from "next";
import Link from "next/link";
import { House, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found" };

/** For web addresses that don't exist at all. */
export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-content-center gap-4 px-6 text-center">
      <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
        <SearchX className="size-8" aria-hidden />
      </span>
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="text-lg text-muted-foreground">This page doesn’t exist. Check the link, or go back to the start.</p>
      <Button asChild size="lg" className="justify-self-center">
        <Link href="/">
          <House aria-hidden /> Go to Home
        </Link>
      </Button>
    </main>
  );
}
