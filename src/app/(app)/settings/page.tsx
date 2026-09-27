import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, KeyRound } from "lucide-react";
import { getCentre } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { CentreForm } from "./centre-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { centre } = await getCentre();

  return (
    <>
      <PageHeader title="Settings" backHref="/more" />
      <CentreForm centre={centre} />

      <section className="mt-10 grid gap-3">
        <h2 className="text-lg font-bold">Appearance</h2>
        <ThemeToggle />
      </section>

      <section className="mt-10 grid gap-3">
        <h2 className="text-lg font-bold">Account</h2>
        <Link
          href="/reset-password"
          className="flex min-h-14 items-center gap-3 rounded-2xl bg-card px-4 text-base font-semibold shadow-sm ring-1 ring-foreground/8 transition-colors hover:bg-muted"
        >
          <KeyRound className="size-5 text-primary" aria-hidden />
          <span className="flex-1">Change password</span>
          <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
        </Link>
      </section>
    </>
  );
}
