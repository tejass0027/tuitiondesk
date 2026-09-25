import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type PageHeaderProps = {
  title: string;
  description?: React.ReactNode;
  /** Shows a back arrow linking here */
  backHref?: string;
  /** Usually the screen's one main button */
  action?: React.ReactNode;
};

export function PageHeader({ title, description, backHref, action }: PageHeaderProps) {
  return (
    <header className="flex items-start gap-3 pb-6">
      {backHref && (
        <Link
          href={backHref}
          aria-label="Go back"
          className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-foreground/10 transition-colors hover:bg-muted"
        >
          <ChevronLeft className="size-6" aria-hidden />
        </Link>
      )}
      <div className="min-w-0 flex-1 pt-0.5">
        <h1 className="text-[1.85rem] leading-tight font-extrabold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-base text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0 pt-0.5">{action}</div>}
    </header>
  );
}
