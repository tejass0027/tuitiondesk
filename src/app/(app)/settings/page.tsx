import type { Metadata } from "next";
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
    </>
  );
}
