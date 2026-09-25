"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { CircleCheck, Clock } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatINR } from "@/lib/format";
import { formatINRShort, type MonthPoint } from "@/lib/dashboard";

// Green = collected, amber = pending — the same meaning as Paid / Due badges.
// Colours are validated for colour-blind separation in both themes (see globals.css).
const config = {
  collected: { label: "Collected", color: "var(--chart-1)", icon: CircleCheck },
  pending: { label: "Pending", color: "var(--chart-2)", icon: Clock },
} satisfies ChartConfig;

/** Last few months as stacked columns: collected (bottom) + pending (top). */
export function FeesChart({ data }: { data: MonthPoint[] }) {
  return (
    <figure className="grid gap-3">
      {/* Legend: icon + word, so it never relies on colour alone */}
      <figcaption className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-medium text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-(--chart-1)" aria-hidden />
          <CircleCheck className="size-4" aria-hidden /> Collected
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-(--chart-2)" aria-hidden />
          <Clock className="size-4" aria-hidden /> Pending
        </span>
      </figcaption>

      <ChartContainer
        config={config}
        className="aspect-auto h-48 w-full"
        role="img"
        aria-label="Fees collected and pending for the last six months. Open View as table for the numbers."
      >
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={13} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(v: number) => formatINRShort(v)}
            fontSize={12}
            allowDecimals={false}
          />
          <ChartTooltip
            cursor={{ fillOpacity: 0.5 }}
            content={
              <ChartTooltipContent
                indicator="dot"
                formatter={(value, name) => (
                  <div className="flex w-full items-center justify-between gap-4">
                    <span className="text-muted-foreground">{config[name as keyof typeof config]?.label}</span>
                    <span className="font-semibold text-foreground">{formatINR(Number(value))}</span>
                  </div>
                )}
              />
            }
          />
          {/* stroke in the card colour draws the 2px gap between the two segments */}
          <Bar dataKey="collected" stackId="fees" fill="var(--color-collected)" stroke="var(--card)" strokeWidth={2} />
          <Bar
            dataKey="pending"
            stackId="fees"
            fill="var(--color-pending)"
            stroke="var(--card)"
            strokeWidth={2}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>

      {/* Same numbers as a table, for screen readers and anyone who prefers text */}
      <details className="group text-sm">
        <summary className="cursor-pointer py-1 font-semibold text-primary select-none">View as table</summary>
        <table className="mt-2 w-full text-left">
          <thead className="text-muted-foreground">
            <tr>
              <th scope="col" className="py-1 font-medium">Month</th>
              <th scope="col" className="py-1 text-right font-medium">Collected</th>
              <th scope="col" className="py-1 text-right font-medium">Pending</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.month} className="border-t">
                <th scope="row" className="py-1.5 font-medium">{d.label} {d.month.slice(0, 4)}</th>
                <td className="py-1.5 text-right">{formatINR(d.collected)}</td>
                <td className="py-1.5 text-right">{formatINR(d.pending)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
