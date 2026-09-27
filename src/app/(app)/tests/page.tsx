import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ChevronRight, Layers, NotebookPen, Plus } from "lucide-react";
import { getCentre } from "@/lib/auth";
import { todayIST } from "@/lib/format";
import { formatDate } from "@/lib/format";
import { formatMarks, scoreBand, summarizeMarks } from "@/lib/marks";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Tests & marks" };

const BAND_STYLE = {
  good: "bg-success-soft text-success",
  average: "bg-warning-soft text-warning",
  low: "bg-danger-soft text-danger",
};

export default async function TestsPage({ searchParams }: PageProps<"/tests">) {
  const params = await searchParams;
  const batchFilter = typeof params.batch === "string" ? params.batch : "";
  const { supabase } = await getCentre();

  let query = supabase
    .from("tests")
    .select("id, name, subject, test_date, max_marks, batch_id, batches(name), test_marks(marks, absent)")
    .order("test_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);
  if (batchFilter) query = query.eq("batch_id", batchFilter);

  const [{ data: tests }, { data: batches }, { data: sizes }] = await Promise.all([
    query,
    supabase.from("batches").select("id, name").eq("is_active", true).order("name"),
    supabase.rpc("batch_day_counts", { p_date: todayIST() }), // students per batch, counted in the database
  ]);

  const sizeOf = new Map((sizes ?? []).map((b) => [b.batch_id, b.size]));
  const batchSize = (id: string) => sizeOf.get(id) ?? 0;
  const newHref = batchFilter ? `/tests/new?batch=${batchFilter}` : "/tests/new";

  if (!batches?.length) {
    return (
      <>
        <PageHeader title="Tests & marks" backHref="/more" />
        <EmptyState
          icon={Layers}
          title="Create a batch first"
          description="Tests belong to a batch. Add a batch and students, then you can enter marks here."
          action={
            <Button asChild size="lg">
              <Link href="/batches/new">
                <Plus aria-hidden /> Add a batch
              </Link>
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Tests & marks"
        backHref="/more"
        action={
          tests?.length || batchFilter ? (
            <Button asChild>
              <Link href={newHref}>
                <Plus aria-hidden /> New test
              </Link>
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-4">
        {batches.length > 1 && (
          <nav
            aria-label="Filter by batch"
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0"
          >
            <Chip href="/tests" active={!batchFilter}>
              All batches
            </Chip>
            {batches.map((b) => (
              <Chip key={b.id} href={`/tests?batch=${b.id}`} active={batchFilter === b.id}>
                {b.name}
              </Chip>
            ))}
          </nav>
        )}

        {!tests?.length ? (
          <EmptyState
            icon={NotebookPen}
            title="No tests yet"
            description="Create a test, then type each student’s marks. Parents can get their child’s result on WhatsApp."
            action={
              <Button asChild size="lg">
                <Link href={newHref}>
                  <Plus aria-hidden /> Create your first test
                </Link>
              </Button>
            }
          />
        ) : (
          <ul className="grid grid-cols-1 gap-2.5">
            {tests.map((t) => {
              const max = Number(t.max_marks);
              const summary = summarizeMarks(t.test_marks, max);
              const entered = t.test_marks.length;
              const size = Math.max(batchSize(t.batch_id), entered);
              const complete = size > 0 && entered >= size;
              return (
                <li key={t.id}>
                  <Link
                    href={`/tests/${t.id}`}
                    className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/8 transition-colors hover:bg-muted/60"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-lg leading-snug font-semibold">
                        {t.name}
                        {t.subject && <span className="font-normal text-muted-foreground"> · {t.subject}</span>}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="size-3.5" aria-hidden /> {formatDate(t.test_date)}
                        </span>
                        <span>{t.batches?.name}</span>
                        <span>Out of {formatMarks(max)}</span>
                      </p>
                      <p className={cn("mt-1 text-sm font-semibold", complete ? "text-success" : "text-warning")}>
                        {entered === 0 ? "Marks not entered" : `${entered}/${size} marks entered`}
                      </p>
                    </div>
                    {summary.averagePercent !== null && (
                      <div className="text-center">
                        <p
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-base font-bold",
                            BAND_STYLE[scoreBand(summary.averagePercent)],
                          )}
                        >
                          {summary.averagePercent}%
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">average</p>
                      </div>
                    )}
                    <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      replace
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex h-11 shrink-0 items-center rounded-full border px-4 text-[0.95rem] font-semibold whitespace-nowrap transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
