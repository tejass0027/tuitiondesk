import { BookOpenCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
        <BookOpenCheck className="size-5.5" aria-hidden />
      </span>
      {showText && <span className="text-xl font-bold tracking-tight">TuitionDesk</span>}
    </span>
  );
}
