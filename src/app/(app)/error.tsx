"use client"; // error pages must run in the browser

import { useEffect } from "react";
import Link from "next/link";
import { House, RotateCcw, TriangleAlert } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

/** Friendly fallback if a page fails to load (e.g. the internet drops). The menu stays usable. */
export default function AppError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      icon={TriangleAlert}
      title="This page didn’t load"
      description="Please check your internet and try again. Your data is safe."
      className="mt-6"
      action={
        <div className="grid gap-2 sm:grid-flow-col">
          <Button size="lg" onClick={() => retry()}>
            <RotateCcw aria-hidden /> Try again
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/">
              <House aria-hidden /> Go to Home
            </Link>
          </Button>
        </div>
      }
    />
  );
}
