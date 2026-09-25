"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { NativeSelect } from "@/components/shared/native-select";

/**
 * "All classes / Class 1 / Class 2 …" dropdown that updates ?class= in the URL.
 * baseHref is the current page URL without the class filter, e.g. "/fees?month=2026-09&tab=due".
 */
export function ClassFilter({ classes, selected, baseHref }: { classes: string[]; selected: string; baseHref: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const hrefFor = (cls: string) => {
    const [path, query = ""] = baseHref.split("?");
    const params = new URLSearchParams(query);
    if (cls) params.set("class", cls);
    else params.delete("class");
    const qs = params.toString();
    return qs ? `${path}?${qs}` : path;
  };
  const match = classes.find((c) => c.toLowerCase() === selected.toLowerCase()) ?? "";

  return (
    <div className="relative">
      <GraduationCap
        className="pointer-events-none absolute top-1/2 left-4 z-10 size-5 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <NativeSelect
        aria-label="Filter by class"
        value={match}
        disabled={pending}
        onChange={(e) => startTransition(() => router.replace(hrefFor(e.target.value), { scroll: false }))}
        className="pl-12"
      >
        <option value="">All classes</option>
        {classes.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}
