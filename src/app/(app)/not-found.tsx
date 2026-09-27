import Link from "next/link";
import { House, SearchX } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

/** Shown inside the app (menu still visible) when a student, test or batch doesn't exist any more. */
export default function NotFound() {
  return (
    <EmptyState
      icon={SearchX}
      title="We couldn’t find that"
      description="It may have been deleted, or the link is wrong. Everything else is safe."
      className="mt-6"
      action={
        <Button asChild size="lg">
          <Link href="/">
            <House aria-hidden /> Go to Home
          </Link>
        </Button>
      }
    />
  );
}
