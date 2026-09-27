import { Check, CheckCheck, IndianRupee, NotebookPen, Trophy, X } from "lucide-react";

/*
 * A decorative "peek" at the app for the login / signup side panel:
 * an attendance card, a fees card, a test-marks card and a WhatsApp reminder bubble.
 * Purely visual (aria-hidden) and drawn with fixed light colours so it
 * looks the same in light and dark mode.
 */

const ROWS = [
  { initials: "AS", name: "Aarav Sharma", present: true, tone: "bg-indigo-100 text-indigo-700" },
  { initials: "DP", name: "Diya Patel", present: true, tone: "bg-amber-100 text-amber-800" },
  { initials: "RK", name: "Rohan Kumar", present: false, tone: "bg-rose-100 text-rose-700" },
  { initials: "SN", name: "Sneha Nair", present: true, tone: "bg-emerald-100 text-emerald-700" },
];

const MARKS = [
  { name: "Sneha Nair", marks: 49, top: true },
  { name: "Aarav Sharma", marks: 46 },
  { name: "Diya Patel", marks: 41 },
  { name: "Rohan Kumar", marks: 28 },
];
const OUT_OF = 50;

function barTone(pct: number) {
  if (pct >= 80) return "bg-emerald-500";
  if (pct >= 60) return "bg-indigo-500";
  return "bg-amber-500";
}

export function AppPreview() {
  return (
    <div aria-hidden className="relative mx-auto h-[600px] w-[580px] max-w-full select-none">
      {/* Attendance card */}
      <div className="absolute top-0 left-0 w-[310px] rounded-3xl bg-white p-5 text-slate-800 shadow-2xl shadow-indigo-950/40 motion-safe:animate-[float_7s_ease-in-out_infinite]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] font-semibold tracking-wider text-slate-400 uppercase">Today · 5:00 PM</p>
            <p className="text-[17px] font-bold">Class 10 Maths</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">3 / 4</span>
        </div>
        <ul className="mt-4 grid gap-2">
          {ROWS.map((r) => (
            <li
              key={r.name}
              className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 ${r.present ? "bg-slate-50" : "bg-rose-50 ring-1 ring-rose-200"}`}
            >
              <span className={`flex size-9 items-center justify-center rounded-full text-[11px] font-bold ${r.tone}`}>
                {r.initials}
              </span>
              <span className="flex-1 text-[14px] font-semibold whitespace-nowrap">{r.name}</span>
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
        <div className="mt-4 rounded-xl bg-indigo-600 py-3 text-center text-[14px] font-bold text-white">
          Save attendance
        </div>
      </div>

      {/* Fees card */}
      <div className="absolute top-12 right-0 w-[240px] rounded-2xl bg-white p-4 text-slate-800 shadow-2xl shadow-indigo-950/40 motion-safe:animate-[float_8s_ease-in-out_infinite_1s]">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <IndianRupee className="size-4" />
          </span>
          <p className="text-[13px] font-semibold text-slate-500">September fees</p>
        </div>
        <p className="mt-2 text-[26px] leading-none font-extrabold">₹42,500</p>
        <p className="mt-1 text-[11px] text-slate-500">collected of ₹54,000</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-[78%] rounded-full bg-emerald-500" />
        </div>
        <div className="mt-2 flex justify-between text-[11px] font-semibold">
          <span className="text-emerald-700">78% paid</span>
          <span className="text-amber-700">6 due</span>
        </div>
      </div>

      {/* Test marks card */}
      <div className="absolute top-[240px] right-0 w-[250px] rounded-2xl bg-white p-4 text-slate-800 shadow-2xl shadow-indigo-950/40 motion-safe:animate-[float_8.5s_ease-in-out_infinite_0.5s]">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
            <NotebookPen className="size-4" />
          </span>
          <div className="leading-tight">
            <p className="text-[13px] font-bold">Unit Test 2 · Maths</p>
            <p className="text-[11px] text-slate-500">Out of {OUT_OF}</p>
          </div>
        </div>
        <ul className="mt-3 grid gap-2">
          {MARKS.map((m) => {
            const pct = Math.round((m.marks / OUT_OF) * 100);
            return (
              <li key={m.name}>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="flex items-center gap-1 font-semibold">
                    {m.name}
                    {m.top && <Trophy className="size-3.5 text-amber-500" />}
                  </span>
                  <span className="font-bold tabular-nums">
                    {m.marks}
                    <span className="font-medium text-slate-400">/{OUT_OF}</span>
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${barTone(pct)}`} style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 flex justify-between rounded-lg bg-violet-50 px-2.5 py-1.5 text-[11px] font-semibold text-violet-700">
          <span>Class average</span>
          <span>82%</span>
        </div>
      </div>

      {/* WhatsApp reminder bubble */}
      <div className="absolute bottom-0 left-10 w-[270px] motion-safe:animate-[float_9s_ease-in-out_infinite_2s]">
        <div className="rounded-2xl rounded-br-md bg-[#dcf8c6] p-3.5 text-[13.5px] leading-snug text-slate-800 shadow-2xl shadow-indigo-950/40">
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
