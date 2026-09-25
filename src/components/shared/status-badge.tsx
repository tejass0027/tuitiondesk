import { CircleAlert, CircleCheck, CircleX, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export type Status = "paid" | "due" | "overdue" | "present" | "absent" | "partial";

const STYLES: Record<Status, { label: string; icon: typeof CircleCheck; className: string }> = {
  paid: { label: "Paid", icon: CircleCheck, className: "bg-success-soft text-success" },
  present: { label: "Present", icon: CircleCheck, className: "bg-success-soft text-success" },
  due: { label: "Due", icon: Clock, className: "bg-warning-soft text-warning" },
  partial: { label: "Part paid", icon: Clock, className: "bg-warning-soft text-warning" },
  overdue: { label: "Overdue", icon: CircleAlert, className: "bg-danger-soft text-danger" },
  absent: { label: "Absent", icon: CircleX, className: "bg-danger-soft text-danger" },
};

/** Colour + icon + word, so status never depends on colour alone. */
export function StatusBadge({
  status,
  label,
  className,
}: {
  status: Status;
  label?: string;
  className?: string;
}) {
  const { label: defaultLabel, icon: Icon, className: tone } = STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-sm font-semibold whitespace-nowrap",
        tone,
        className,
      )}
    >
      <Icon className="size-4" aria-hidden />
      {label ?? defaultLabel}
    </span>
  );
}
