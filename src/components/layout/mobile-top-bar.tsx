import Link from "next/link";
import { BookOpenCheck, Settings } from "lucide-react";

/** Phone-only slim bar at the top: brand + centre name + settings. */
export function MobileTopBar({ centreName }: { centreName: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-foreground/5 bg-background/80 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex h-14 max-w-3xl items-center gap-2.5 px-4">
        <Link href="/" className="flex min-w-0 flex-1 items-center gap-2.5" aria-label="Home">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/30">
            <BookOpenCheck className="size-5" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-[0.95rem] leading-tight font-bold">TuitionDesk</span>
            <span className="block truncate text-xs leading-tight text-muted-foreground">{centreName}</span>
          </span>
        </Link>
        <Link
          href="/settings"
          aria-label="Settings"
          className="flex size-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Settings className="size-5" />
        </Link>
      </div>
    </header>
  );
}
