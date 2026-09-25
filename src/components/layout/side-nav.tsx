"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logout } from "@/app/(auth)/actions";
import { PRIMARY_NAV, SECONDARY_NAV, isActive, type NavItem } from "./nav-items";

/** Desktop-only sidebar. Phones use <BottomNav /> instead. */
export function SideNav({ centreName }: { centreName: string }) {
  const pathname = usePathname();
  const main = PRIMARY_NAV.filter((item) => item.href !== "/more");

  return (
    <aside className="sticky top-0 hidden h-dvh w-68 shrink-0 flex-col border-r bg-sidebar px-4 py-6 lg:flex">
      <Link href="/" className="px-2">
        <Logo />
      </Link>
      <p className="mt-3 truncate px-2 text-sm font-medium text-muted-foreground">{centreName}</p>

      <nav aria-label="Main" className="mt-8 grid gap-1">
        {main.map((item) => (
          <SideLink key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}
        <div className="my-3 h-px bg-border" />
        {SECONDARY_NAV.map((item) => (
          <SideLink key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}
      </nav>

      <form action={logout} className="mt-auto">
        <Button type="submit" variant="ghost" className="w-full justify-start text-muted-foreground">
          <LogOut aria-hidden /> Log out
        </Button>
      </form>
    </aside>
  );
}

function SideLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-12 items-center gap-3 rounded-xl px-3 text-base font-semibold transition-colors",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="size-5" aria-hidden />
      {item.label}
    </Link>
  );
}
