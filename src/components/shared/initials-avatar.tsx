import { cn } from "@/lib/utils";

// Soft backgrounds picked from the name, so each student keeps the same colour
const TONES = [
  "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200",
  "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
  "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
  "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
];

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/** Round avatar: the student's photo when there is one, otherwise coloured initials. */
export function InitialsAvatar({ name, photoUrl, className }: { name: string; photoUrl?: string | null; className?: string }) {
  if (photoUrl) {
    return (
      // Signed Supabase URLs change every visit, so a plain <img> is simpler than next/image here
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt=""
        aria-hidden
        loading="lazy"
        className={cn("size-12 shrink-0 rounded-full bg-muted object-cover", className)}
      />
    );
  }
  const tone = TONES[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % TONES.length];
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-12 shrink-0 items-center justify-center rounded-full text-base font-bold",
        tone,
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
