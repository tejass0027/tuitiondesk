"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { NativeSelect } from "@/components/shared/native-select";

/** "All classes / Class 1 / Class 2 …" dropdown that updates ?class= in the URL. */
export function ClassFilter({
  classes,
  selected,
  hrefFor,
}: {
  classes: string[];
  selected: string;
  hrefFor: (cls: string) => string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
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
