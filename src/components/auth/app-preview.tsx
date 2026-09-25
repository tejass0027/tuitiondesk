import { Check, CheckCheck, IndianRupee, X } from "lucide-react";

/*
 * A decorative "peek" at the app for the login / signup side panel:
 * an attendance card, a fees card and a WhatsApp reminder bubble.
 * Purely visual (aria-hidden) and drawn with fixed light colours so it
 * looks the same in light and dark mode.
 */

const ROWS = [
  { initials: "AS", name: "Aarav Sharma", present: true, tone: "bg-indigo-100 text-indigo-700" },
  { initials: "DP", name: "Diya Patel", present: true, tone: "bg-amber-100 text-amber-800" },
  { initials: "RK", name: "Rohan Kumar", present: false, tone: "bg-rose-100 text-rose-700" },
  { initials: "SN", name: "Sneha Nair", present: true, tone: "bg-emerald-100 text-emerald-700" },
];

export function AppPreview() {
  return (
    <div aria-hidden className="relative mx-auto h-[360px] w-[500px] max-w-full select-none">
      {/* Attendance card */}
      <div className="absolute top-10 left-0 w-[290px] rounded-3xl bg-white p-5 text-slate-800 shadow-2xl shadow-indigo-950/40 motion-safe:animate-[float_7s_ease-in-out_infinite]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Today · 5:00 PM</p>
            <p className="text-[15px] font-bold">Class 10 Maths</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">3 / 4</span>
        </div>
        <ul className="mt-4 grid gap-2">
          {ROWS.map((r) => (
            <li
              key={r.name}
              className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 ${r.present ? "bg-slate-50" : "bg-rose-50 ring-1 ring-rose-200"}`}
            >
              <span className={`flex size-8 items-center justify-center rounded-full text-[11px] font-bold ${r.tone}`}>
                {r.initials}
              </span>
              <span className="flex-1 text-[13px] font-semibold whitespace-nowrap">{r.name}</span>
              {r.present ? (
                <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                  <Check className="size-3" /> Present
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-rose-600 px-2 py-0.5 text-[11px] font-bold text-white">
                  <X className="size-3" /> Absent
                </span>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-4 rounded-xl bg-indigo-600 py-2.5 text-center text-[13px] font-bold text-white">
          Save attendance
        </div>
      </div>

      {/* Fees card */}
      <div className="absolute top-0 right-0 w-[200px] rounded-2xl bg-white p-4 text-slate-800 shadow-2xl shadow-indigo-950/40 motion-safe:animate-[float_8s_ease-in-out_infinite_1s]">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <IndianRupee className="size-4" />
          </span>
          <p className="text-[12px] font-semibold text-slate-500">September fees</p>
        </div>
        <p className="mt-2 text-[22px] leading-none font-extrabold">₹42,500</p>
        <p className="mt-1 text-[11px] text-slate-500">collected of ₹54,000</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-[78%] rounded-full bg-emerald-500" />
        </div>
        <div className="mt-2 flex justify-between text-[11px] font-semibold">
          <span className="text-emerald-700">78% paid</span>
          <span className="text-amber-700">6 due</span>
        </div>
      </div>

      {/* WhatsApp reminder bubble */}
      <div className="absolute right-0 bottom-0 w-[230px] motion-safe:animate-[float_9s_ease-in-out_infinite_2s]">
        <div className="rounded-2xl rounded-br-md bg-[#dcf8c6] p-3.5 text-[12.5px] leading-snug text-slate-800 shadow-2xl shadow-indigo-950/40">
          Namaste Rajesh ji, this is a reminder that Aarav&apos;s fee of <b>₹1,500</b> for September is due. – Sharma
          Classes
          <span className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-500">
            5:02 PM <CheckCheck className="size-3.5 text-sky-500" />
          </span>
        </div>
        <p className="mt-1.5 text-right text-[11px] font-medium text-white/70">Sent from TuitionDesk via WhatsApp</p>
      </div>
    </div>
  );
}
