import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  label: string;
  htmlFor: string;
  error?: string[];
  hint?: string;
  className?: string;
  children: React.ReactNode;
};

/** Label + input + hint/error text, stacked with comfortable spacing. */
export function FormField({ label, htmlFor, error, hint, className, children }: FormFieldProps) {
  const message = error?.[0];
  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={htmlFor} className="text-base font-semibold">
        {label}
      </Label>
      {children}
      {message ? (
        <p id={`${htmlFor}-error`} className="text-sm font-medium text-danger" role="alert">
          {message}
        </p>
      ) : hint ? (
        <p className="text-sm text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
