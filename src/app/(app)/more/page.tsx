import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, LogOut } from "lucide-react";
import { getCentre } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { SECONDARY_NAV } from "@/components/layout/nav-items";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/(auth)/actions";

export const metadata: Metadata = { title: "More" };

const DESCRIPTIONS: Record<string, string> = {
  "/tests": "Enter test marks and share results",
  "/batches": "Classes, timings and monthly fees",
  "/reminders": "Who was reminded and when",
  "/settings": "Centre name, phone, fee due date",
};

export default async function MorePage() {
  const { centre, user } = await getCentre();

  return (
    <>
      <PageHeader title="More" description={centre.name} />

      <nav aria-label="More pages" className="grid grid-cols-1 gap-3">
        {SECONDARY_NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/8 transition-colors hover:bg-muted/60"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25">
              <Icon className="size-6" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-semibold">{label}</span>
              <span className="block text-sm text-muted-foreground">{DESCRIPTIONS[href]}</span>
            </span>
            <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
          </Link>
        ))}
      </nav>

      <section className="mt-8 grid gap-3">
        <h2 className="text-lg font-bold">Appearance</h2>
        <ThemeToggle />
      </section>

      <section className="mt-8 grid gap-3">
        <p className="text-sm text-muted-foreground">Logged in as {user.email}</p>
        <form action={logout}>
          <Button type="submit" variant="outline" size="lg" className="w-full">
            <LogOut aria-hidden /> Log out
          </Button>
        </form>
      </section>
    </>
  );
}
