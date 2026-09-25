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
        "flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed bg-card/60 px-6 py-12 text-center",
        className,
      )}
    >
      <span className="flex size-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
        <Icon className="size-8" aria-hidden />
      </span>
      <h2 className="text-xl font-bold">{title}</h2>
      {description && <p className="max-w-xs text-base text-muted-foreground">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
