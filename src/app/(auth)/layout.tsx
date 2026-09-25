import { CalendarCheck, CircleCheck, IndianRupee, LockKeyhole, MessageCircle } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { AppPreview } from "@/components/auth/app-preview";

const FEATURES = [
  { icon: CalendarCheck, text: "Attendance" },
  { icon: IndianRupee, text: "Fees" },
  { icon: MessageCircle, text: "WhatsApp reminders" },
];

const TRUST = ["Free to start", "Works on any phone", "No app to install"];

/** Shared frame for login + signup: brand panel on the left (top on phones), form on the right. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      {/* Brand panel */}
      <aside className="relative isolate overflow-hidden bg-[#1e1b4b] text-white lg:sticky lg:top-0 lg:h-dvh">
        {/* layered background: gradient, soft glows, faint grid */}
        <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-br from-indigo-950 via-indigo-700 to-violet-600" />
        <div aria-hidden className="absolute -top-32 -right-24 -z-10 size-[28rem] rounded-full bg-fuchsia-500/30 blur-3xl" />
        <div aria-hidden className="absolute -bottom-40 -left-32 -z-10 size-[30rem] rounded-full bg-sky-400/20 blur-3xl" />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-[0.12] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
        />

        <div className="relative mx-auto flex h-full max-w-2xl flex-col px-6 pt-7 pb-11 lg:px-12 lg:py-9">
          <span className="inline-flex items-center gap-2.5">
            <Logo showText={false} className="[&>span]:bg-white [&>span]:text-indigo-700 [&>span]:shadow-lg" />
            <span className="text-xl font-bold tracking-tight">TuitionDesk</span>
          </span>

          <div className="mt-5 lg:my-auto lg:py-6">
            <p className="hidden items-center gap-2 rounded-full bg-white/10 px-3 py-1 lg:inline-flex text-sm font-medium text-white/90 ring-1 ring-white/20 backdrop-blur">
              <span className="size-2 rounded-full bg-emerald-400" /> Made for tuition &amp; coaching centres
            </p>
            <h2 className="text-[1.75rem] lg:mt-4 leading-[1.15] font-extrabold tracking-tight text-balance lg:text-[2.6rem] xl:text-5xl">
              Your coaching centre,{" "}
              <span className="bg-linear-to-r from-amber-200 via-pink-200 to-sky-200 bg-clip-text text-transparent">
                out of the notebook
              </span>{" "}
              and into your phone.
            </h2>
            <p className="mt-4 hidden max-w-md text-lg text-indigo-100/90 lg:block">
              Mark attendance in seconds, know exactly who has paid, and remind parents on WhatsApp in one tap.
            </p>

            {/* Desktop: a peek at the app (skipped on short screens) */}
            <div className="mt-10 hidden h-[360px] lg:block [@media(max-height:960px)]:mt-6 [@media(max-height:960px)]:h-[290px] [@media(max-height:780px)]:hidden">
              <div className="origin-top-left [@media(max-height:960px)]:scale-[0.8]">
                <AppPreview />
              </div>
            </div>

            {/* Phones: small feature chips instead of the big preview */}
            <ul className="mt-4 flex flex-wrap gap-2 lg:hidden">
              {FEATURES.map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-sm font-semibold ring-1 ring-white/20"
                >
                  <Icon className="size-4" aria-hidden /> {text}
                </li>
              ))}
            </ul>
          </div>


          <ul className="hidden flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-indigo-100/90 lg:flex">
            {TRUST.map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <CircleCheck className="size-4 text-emerald-300" aria-hidden /> {t}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Form side */}
      <main className="relative -mt-6 flex flex-1 flex-col rounded-t-[2rem] bg-background px-5 pt-9 pb-10 shadow-[0_-12px_40px_-12px_rgb(0_0_0/0.25)] lg:mt-0 lg:rounded-none lg:px-10 lg:shadow-none">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 hidden h-72 bg-radial-[at_50%_0%] from-primary/10 to-transparent lg:block"
        />
        <div className="relative m-auto w-full max-w-[26rem]">{children}</div>
        <p className="relative mx-auto mt-10 flex max-w-[26rem] items-center justify-center gap-2 text-center text-sm text-muted-foreground">
          <LockKeyhole className="size-4 shrink-0" aria-hidden />
          Your centre’s data is private. Only you can see it.
        </p>
      </main>
    </div>
  );
}
