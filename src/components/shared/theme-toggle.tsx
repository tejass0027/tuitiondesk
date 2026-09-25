"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "Auto", icon: Monitor },
] as const;

// true in the browser, false during server render (theme is unknown on the server)
const subscribe = () => () => {};
const useIsClient = () => useSyncExternalStore(subscribe, () => true, () => false);

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isClient = useIsClient();

  return (
    <div role="radiogroup" aria-label="Appearance" className="grid grid-cols-3 gap-2 rounded-2xl bg-muted p-1.5">
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const selected = isClient && theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setTheme(value)}
            className={cn(
              "flex h-12 items-center justify-center gap-2 rounded-xl text-base font-semibold transition-colors",
              selected
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}
