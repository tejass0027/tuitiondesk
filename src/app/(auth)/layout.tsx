import { CalendarCheck, IndianRupee, MessageCircle } from "lucide-react";
import { Logo } from "@/components/brand/logo";

const HIGHLIGHTS = [
  { icon: CalendarCheck, text: "Mark a whole batch present in seconds" },
  { icon: IndianRupee, text: "Know exactly who has paid and who hasn't" },
  { icon: MessageCircle, text: "Send fee reminders to parents on WhatsApp" },
];

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col lg:flex-row">
      {/* Friendly intro panel: a short strip on phones, a side panel on desktop */}
      <aside className="relative overflow-hidden bg-linear-to-br from-indigo-700 via-indigo-600 to-violet-600 px-6 pt-10 pb-14 text-white lg:flex lg:w-[44%] lg:flex-col lg:justify-center lg:px-14">
        <div
          aria-hidden
          className="absolute -top-24 -right-24 size-72 rounded-full bg-white/10 blur-2xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-28 -left-16 size-72 rounded-full bg-white/10 blur-2xl"
        />
        <div className="relative mx-auto max-w-md lg:mx-0">
          <span className="inline-flex items-center gap-2.5">
            <Logo showText={false} className="[&>span]:bg-white [&>span]:text-indigo-700" />
            <span className="text-xl font-bold tracking-tight">TuitionDesk</span>
          </span>
          <p className="mt-5 text-2xl leading-snug font-bold lg:text-4xl">
            Your coaching centre, out of the notebook and into your phone.
          </p>
          <ul className="mt-8 hidden gap-4 lg:grid">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-lg text-white/90">
                <span className="flex size-10 items-center justify-center rounded-xl bg-white/15">
                  <Icon className="size-5" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="relative -mt-6 flex flex-1 justify-center rounded-t-3xl bg-background px-5 pt-8 pb-12 lg:mt-0 lg:items-center lg:rounded-none">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
