import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ChevronRight, Clock, Layers, Plus, Users } from "lucide-react";
import { getCentre } from "@/lib/auth";
import { formatDays, formatTimeRange } from "@/lib/batches";
import { formatINR } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Batches" };

export default async function BatchesPage() {
  const { supabase } = await getCentre();
  const { data: batches } = await supabase
    .from("batches")
    .select("*, students(count)")
    .order("is_active", { ascending: false })
    .order("name");

  const addButton = (
    <Button asChild>
      <Link href="/batches/new">
        <Plus aria-hidden /> Add batch
      </Link>
    </Button>
  );

  return (
    <>
      <PageHeader title="Batches" backHref="/more" action={batches?.length ? addButton : undefined} />

      {!batches?.length ? (
        <EmptyState
          icon={Layers}
          title="No batches yet"
          description="Create your first batch, like “Class 10 Maths – Evening”, with its days and fee."
          action={
            <Button asChild size="lg">
              <Link href="/batches/new">
                <Plus aria-hidden /> Add your first batch
              </Link>
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3">
          {batches.map((batch) => {
            const studentCount = batch.students[0]?.count ?? 0;
            const time = formatTimeRange(batch.start_time, batch.end_time);
            return (
              <li key={batch.id}>
                <Link
                  href={`/batches/${batch.id}`}
                  className="flex items-center gap-4 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/8 transition-colors hover:bg-muted/60 data-[inactive=true]:opacity-60"
                  data-inactive={!batch.is_active}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold">{batch.name}</h2>
                      {!batch.is_active && <Badge variant="secondary">Archived</Badge>}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.95rem] text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="size-4" aria-hidden /> {formatDays(batch.days)}
                      </span>
                      {time && (
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="size-4" aria-hidden /> {time}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="size-4" aria-hidden /> {studentCount}{" "}
                        {studentCount === 1 ? "student" : "students"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{formatINR(batch.monthly_fee)}</p>
                    <p className="text-sm text-muted-foreground">per month</p>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
