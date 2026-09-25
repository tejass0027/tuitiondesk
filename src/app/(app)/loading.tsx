import { Skeleton } from "@/components/ui/skeleton";

/** Shown instantly while any signed-in page loads its data. */
export default function Loading() {
  return (
    <div className="grid gap-6" aria-busy="true" aria-label="Loading">
      <div className="grid gap-2 pt-1">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-5 w-32 rounded-lg" />
      </div>
      <Skeleton className="h-32 rounded-2xl" />
      <div className="grid gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
