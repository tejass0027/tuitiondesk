"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PRIMARY_NAV, isActive, isMoreActive } from "./nav-items";

/** Phone-only floating tab bar at the bottom of the screen. */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5 rounded-3xl bg-card/90 p-1.5 shadow-[0_10px_40px_-8px_rgb(30_27_75/0.35)] ring-1 ring-foreground/10 backdrop-blur-xl">
        {PRIMARY_NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/more" ? isMoreActive(pathname) : isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-15 flex-col items-center justify-center gap-0.5 rounded-2xl text-[0.75rem] font-semibold transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-12 items-center justify-center rounded-xl transition-all",
                    active && "bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/40",
                  )}
                >
                  <Icon className="size-5.5" strokeWidth={active ? 2.4 : 2} aria-hidden />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
