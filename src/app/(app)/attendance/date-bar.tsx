"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays } from "@/lib/calendar";
import { formatDate } from "@/lib/format";
import { WEEK_DAYS, dayKeyOf } from "@/lib/batches";
import { cn } from "@/lib/utils";

/** ‹  Today · 25 Sep 2026  ›  — tap the middle to pick any date. */
export function DateBar({ date, today }: { date: string; today: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hrefFor = (d: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("date", d);
    return `${pathname}?${params}`;
  };

  const label =
    date === today
      ? "Today"
      : date === addDays(today, -1)
        ? "Yesterday"
        : WEEK_DAYS.find((d) => d.key === dayKeyOf(date))!.label;
  const isToday = date >= today;
  const arrow =
    "flex size-12 shrink-0 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-muted";

  return (
    <div className="flex items-center gap-1 rounded-2xl bg-card p-1.5 shadow-sm ring-1 ring-foreground/8">
      <Link href={hrefFor(addDays(date, -1))} replace scroll={false} className={arrow} aria-label="Previous day">
        <ChevronLeft className="size-6" />
      </Link>

      <label className="relative flex min-w-0 flex-1 cursor-pointer flex-col items-center rounded-xl py-1 hover:bg-muted">
        <span className="text-lg leading-tight font-bold">{label}</span>
        <span className="text-sm text-muted-foreground">{formatDate(date)}</span>
        <input
          type="date"
          value={date}
          max={today}
          aria-label="Pick a date"
          onChange={(e) => e.target.value && router.replace(hrefFor(e.target.value), { scroll: false })}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>

      {isToday ? (
        <span className={cn(arrow, "pointer-events-none opacity-30")} aria-hidden>
          <ChevronRight className="size-6" />
        </span>
      ) : (
        <Link href={hrefFor(addDays(date, 1))} replace scroll={false} className={arrow} aria-label="Next day">
          <ChevronRight className="size-6" />
        </Link>
      )}
    </div>
  );
}
