import { getCentre } from "@/lib/auth";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SideNav } from "@/components/layout/side-nav";

/** Shell for every signed-in screen: sidebar on desktop, bottom tabs on phones. */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { centre } = await getCentre();

  return (
    <div className="flex min-h-dvh flex-1">
      <SideNav centreName={centre.name} />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6 pb-32 sm:px-6 lg:pt-10 lg:pb-16">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
