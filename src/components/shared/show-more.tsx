import Link from "next/link";
import { ChevronDown } from "lucide-react";

/** "Showing 50 of 1,240 · Show more" under a long list. Hidden when everything is shown. */
export function ShowMore({ shown, total, href }: { shown: number; total: number; href: string }) {
  if (shown >= total) return null;
  return (
    <div className="grid justify-items-center gap-2 pt-2">
      <p className="text-sm text-muted-foreground">
        Showing {shown.toLocaleString("en-IN")} of {total.toLocaleString("en-IN")}
      </p>
      <Link
        href={href}
        scroll={false}
        replace
        className="inline-flex h-12 items-center gap-2 rounded-xl border bg-card px-5 text-base font-semibold shadow-sm transition-colors hover:bg-muted"
      >
        <ChevronDown className="size-5" aria-hidden /> Show more
      </Link>
    </div>
  );
}
