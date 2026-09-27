"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { Link2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { setParentLinks } from "./actions";

/** On / off switch for the whole parent-link feature. */
export function ParentLinksToggle({ enabled }: { enabled: boolean }) {
  const [on, setOn] = useOptimistic(enabled);
  const [, startTransition] = useTransition();

  return (
    <label className="flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-sm ring-1 ring-foreground/8">
      <Link2 className="size-5 shrink-0 text-primary" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold">Parent links</span>
        <span className="block text-sm text-muted-foreground">
          {on
            ? "On. You can share a private page per student with attendance, marks and fees."
            : "Off. Parents can't open any links, and the option is hidden on profiles."}
        </span>
      </span>
      <Switch
        checked={on}
        aria-label="Parent links"
        onCheckedChange={(next) =>
          startTransition(async () => {
            setOn(next);
            const res = await setParentLinks(next);
            if (res?.ok) toast.success(res.message);
            else toast.error(res?.message ?? "Could not change the setting.");
          })
        }
      />
    </label>
  );
}
