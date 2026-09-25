"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenCheck, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/app/(auth)/actions";
import { initials } from "@/components/shared/initials-avatar";
import { PRIMARY_NAV, SECONDARY_NAV, isActive, type NavItem } from "./nav-items";

/** Desktop-only sidebar in the brand colours. Phones use <BottomNav /> instead. */
export function SideNav({ centreName, email }: { centreName: string; email: string }) {
  const pathname = usePathname();
  const main = PRIMARY_NAV.filter((item) => item.href !== "/more");

  return (
    <aside className="sticky top-0 isolate hidden h-dvh w-72 shrink-0 flex-col overflow-hidden bg-[#1e1b4b] px-4 py-6 text-white lg:flex">
      <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-b from-indigo-950 via-indigo-900 to-violet-950" />
      <div aria-hidden className="absolute -top-24 -right-24 -z-10 size-72 rounded-full bg-violet-500/25 blur-3xl" />

      <Link href="/" className="flex items-center gap-2.5 px-2">
        <span className="flex size-10 items-center justify-center rounded-xl bg-white text-indigo-700 shadow-lg shadow-black/20">
          <BookOpenCheck className="size-5.5" aria-hidden />
        </span>
        <span className="text-xl font-bold tracking-tight">TuitionDesk</span>
      </Link>

      {/* Centre card */}
      <div className="mt-6 flex items-center gap-3 rounded-2xl bg-white/8 p-3 ring-1 ring-white/10">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-amber-300 to-pink-400 text-sm font-extrabold text-indigo-950">
          {initials(centreName)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[0.95rem] font-semibold">{centreName}</span>
          <span className="block truncate text-xs text-indigo-200/80">{email}</span>
        </span>
      </div>

      <nav aria-label="Main" className="mt-6 grid gap-1">
        <p className="px-3 pb-1 text-[11px] font-bold tracking-widest text-indigo-300/70 uppercase">Daily</p>
        {main.map((item) => (
          <SideLink key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}
        <p className="px-3 pt-4 pb-1 text-[11px] font-bold tracking-widest text-indigo-300/70 uppercase">Manage</p>
        {SECONDARY_NAV.map((item) => (
          <SideLink key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}
      </nav>

      <form action={logout} className="mt-auto">
        <button
          type="submit"
          className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[0.95rem] font-semibold text-indigo-200 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="size-5" aria-hidden /> Log out
        </button>
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
        "relative flex h-11 items-center gap-3 rounded-xl px-3 text-[0.95rem] font-semibold transition-colors",
        active ? "bg-white text-indigo-900 shadow-lg shadow-black/20" : "text-indigo-100/80 hover:bg-white/10 hover:text-white",
      )}
    >
      <Icon className={cn("size-5", active && "text-indigo-600")} aria-hidden />
      {item.label}
    </Link>
  );
}
