import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SubmitButtonProps = React.ComponentProps<typeof Button> & {
  pending?: boolean;
  pendingText?: string;
};

/** Full-width primary button that shows a spinner while the form is saving. */
export function SubmitButton({
  pending,
  pendingText = "Saving…",
  children,
  className,
  size = "lg",
  ...props
}: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      size={size}
      disabled={pending || props.disabled}
      className={cn("w-full", className)}
      {...props}
    >
      {pending ? (
        <>
          <Loader2 className="animate-spin" aria-hidden />
          {pendingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
