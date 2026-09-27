import { getCentre } from "@/lib/auth";
import { BottomNav } from "@/components/layout/bottom-nav";
import { MobileTopBar } from "@/components/layout/mobile-top-bar";
import { SideNav } from "@/components/layout/side-nav";
import { FlashToast } from "@/components/shared/flash-toast";

/** Shell for every signed-in screen: sidebar on desktop, top bar + bottom tabs on phones. */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { centre, user } = await getCentre();

  return (
    <div className="flex min-h-dvh flex-1">
      <SideNav centreName={centre.name} email={user.email ?? ""} />
      <div className="relative isolate flex min-w-0 flex-1 flex-col">
        {/* soft brand glow at the top of every page */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-radial-[ellipse_at_top] from-indigo-500/12 via-violet-500/5 to-transparent"
        />
        <MobileTopBar centreName={centre.name} />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-5 pb-36 sm:px-6 lg:pt-10 lg:pb-16">{children}</main>
        <FlashToast />
      </div>
      <BottomNav />
    </div>
  );
}
