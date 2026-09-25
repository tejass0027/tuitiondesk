import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

/** Friendly "nothing here yet" card with one clear next step. */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "relative isolate flex flex-col items-center gap-3 overflow-hidden rounded-3xl bg-card px-6 py-12 text-center shadow-sm ring-1 ring-foreground/8",
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-40 bg-radial-[ellipse_at_top] from-indigo-500/15 to-transparent"
      />
      <span className="flex size-18 items-center justify-center rounded-3xl bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
        <Icon className="size-9" aria-hidden />
      </span>
      <h2 className="mt-1 text-xl font-bold">{title}</h2>
      {description && <p className="max-w-xs text-base text-muted-foreground">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
