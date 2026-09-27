import type { Metadata } from "next";
import { PartyPopper } from "lucide-react";
import { getCentre } from "@/lib/auth";
import { addDays } from "@/lib/calendar";
import { todayIST } from "@/lib/format";
import { formatHolidayRange, groupHolidays, type HolidayGroup } from "@/lib/holidays";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AddHolidayForm, DeleteHolidayButton } from "./holiday-controls";

export const metadata: Metadata = { title: "Holidays" };

export default async function HolidaysPage() {
  const today = todayIST();
  const { supabase } = await getCentre();
  const { data: rows } = await supabase
    .from("holidays")
    .select("id, date, name")
    .gte("date", addDays(today, -120))
    .order("date");

  const groups = groupHolidays(rows ?? []);
  const upcoming = groups.filter((g) => g.to >= today);
  const past = groups.filter((g) => g.to < today).reverse();

  return (
    <>
      <PageHeader
        title="Holidays"
        backHref="/more"
        description="Days the centre is closed. Attendance isn’t taken on them."
      />
      <div className="grid grid-cols-1 gap-6">
        <AddHolidayForm today={today} />

        {groups.length === 0 ? (
          <EmptyState
            icon={PartyPopper}
            title="No holidays added"
            description="Add festivals and breaks here. They show on calendars, and the attendance page tells you the centre is closed."
          />
        ) : (
          <>
            <HolidayList title="Coming up" groups={upcoming} today={today} empty="No upcoming holidays." />
            {past.length > 0 && <HolidayList title="Recent" groups={past} today={today} muted />}
          </>
        )}
      </div>
    </>
  );
}

function HolidayList({
  title,
  groups,
  today,
  empty,
  muted,
}: {
  title: string;
  groups: HolidayGroup[];
  today: string;
  empty?: string;
  muted?: boolean;
}) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      {groups.length === 0 ? (
        <p className="text-base text-muted-foreground">{empty}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-2.5">
          {groups.map((g) => {
            const now = g.from <= today && today <= g.to;
            return (
              <li
                key={g.ids[0]}
                className={cn(
                  "flex items-center gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/8",
                  muted && "opacity-70",
                )}
              >
                <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-warning-soft text-warning">
                  <span className="text-lg leading-none font-bold">{Number(g.from.slice(8))}</span>
                  <span className="text-[0.7rem] font-semibold uppercase">
                    {new Date(`${g.from}T00:00:00`).toLocaleString("en-IN", { month: "short" })}
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-lg font-semibold">
                    {g.name}
                    {now && (
                      <span className="rounded-full bg-warning-soft px-2 py-0.5 text-xs font-bold text-warning">Today</span>
                    )}
                  </p>
                  <p className="text-[0.95rem] text-muted-foreground">
                    {formatHolidayRange(g.from, g.to)}
                    {g.days > 1 && ` · ${g.days} days`}
                  </p>
                </div>
                <DeleteHolidayButton ids={g.ids} label={g.name} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
