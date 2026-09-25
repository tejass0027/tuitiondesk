import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

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
        <Button asChild variant="ghost" size="icon" className="-ml-3 shrink-0">
          <Link href={backHref} aria-label="Go back">
            <ChevronLeft className="size-7" aria-hidden />
          </Link>
        </Button>
      )}
      <div className="min-w-0 flex-1 pt-1">
        <h1 className="text-[1.75rem] leading-tight font-bold">{title}</h1>
        {description && <p className="mt-1 text-base text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
