"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PRIMARY_NAV, isActive, isMoreActive } from "./nav-items";

/** Phone-only tab bar fixed to the bottom of the screen. */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-backdrop-filter:bg-card/85 lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {PRIMARY_NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/more" ? isMoreActive(pathname) : isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-17 flex-col items-center justify-center gap-1 text-[0.8rem] font-semibold transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
                    active && "bg-accent",
                  )}
                >
                  <Icon className="size-6" strokeWidth={active ? 2.4 : 2} aria-hidden />
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
