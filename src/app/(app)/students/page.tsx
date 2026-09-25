import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Plus, SearchX, Users } from "lucide-react";
import { getCentre } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { classLabel } from "@/lib/classes";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { InitialsAvatar } from "@/components/shared/initials-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StudentSearch } from "./student-search";
import { ClassFilter } from "@/components/shared/class-filter";

export const metadata: Metadata = { title: "Students" };

export default async function StudentsPage({ searchParams }: PageProps<"/students">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const batchFilter = typeof params.batch === "string" ? params.batch : "";
  const classFilter = typeof params.class === "string" ? params.class : "";

  const { supabase } = await getCentre();

  let query = supabase
    .from("students")
    .select("id, name, class, parent_name, is_active, batch_id, batches(name)")
    .order("is_active", { ascending: false })
    .order("name");
  if (batchFilter) query = query.eq("batch_id", batchFilter);
  if (classFilter) query = query.ilike("class", classFilter.replace(/[%_\\]/g, ""));
  if (q) {
    // strip characters that have a meaning in PostgREST filters
    const safe = q.replace(/[,()*%\\]/g, " ");
    query = query.or(`name.ilike.%${safe}%,parent_name.ilike.%${safe}%`);
  }

  const [{ data: students }, { data: batches }, { count: totalCount }, { data: classes }] = await Promise.all([
    query,
    supabase.from("batches").select("id, name").eq("is_active", true).order("name"),
    supabase.from("students").select("id", { count: "exact", head: true }),
    supabase.from("classes").select("name, sort_order").order("sort_order").order("name"),
  ]);

  const addHref = batchFilter ? `/students/new?batch=${batchFilter}` : "/students/new";
  const hasNoStudentsAtAll = totalCount === 0;
  const activeCount = students?.filter((s) => s.is_active).length ?? 0;

  return (
    <>
      <PageHeader
        title="Students"
        description={
          hasNoStudentsAtAll ? undefined : `${activeCount} active${q || batchFilter || classFilter ? " shown" : ""}`
        }
        action={
          !hasNoStudentsAtAll && (
            <Button asChild>
              <Link href={addHref}>
                <Plus aria-hidden /> Add
              </Link>
            </Button>
          )
        }
      />

      {hasNoStudentsAtAll ? (
        <EmptyState
          icon={Users}
          title="No students yet"
          description="Add your first student. It only needs a name, a batch and a parent's WhatsApp number."
          action={
            <Button asChild size="lg">
              <Link href="/students/new">
                <Plus aria-hidden /> Add your first student
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <StudentSearch />

          {classes && classes.length > 0 && (
            <ClassFilter
              classes={classes.map((c) => c.name)}
              selected={classFilter}
              hrefFor={(cls) => hrefWith(q, batchFilter, cls)}
            />
          )}

          {batches && batches.length > 1 && (
            <nav
              aria-label="Filter by batch"
              className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0"
            >
              <FilterChip href={hrefWith(q, "", classFilter)} active={!batchFilter}>
                All batches
              </FilterChip>
              {batches.map((b) => (
                <FilterChip key={b.id} href={hrefWith(q, b.id, classFilter)} active={batchFilter === b.id}>
                  {b.name}
                </FilterChip>
              ))}
            </nav>
          )}

          {!students?.length ? (
            <EmptyState
              icon={SearchX}
              title="No matching students"
              description={q ? `Nobody found for “${q}”. Check the spelling or try another batch.` : "No students in this batch yet."}
              action={
                <Button asChild variant="outline" size="lg">
                  <Link href={addHref}>
                    <Plus aria-hidden /> Add a student
                  </Link>
                </Button>
              }
            />
          ) : (
            <ul className="grid grid-cols-1 gap-2.5">
              {students.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/students/${s.id}`}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/8 transition-colors hover:bg-muted/60",
                      !s.is_active && "opacity-60",
                    )}
                  >
                    <InitialsAvatar name={s.name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-lg font-semibold">{s.name}</p>
                        {!s.is_active && <Badge variant="secondary">Left</Badge>}
                      </div>
                      <p className="truncate text-[0.95rem] text-muted-foreground">
                        {[s.class && classLabel(s.class), s.batches?.name].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}

function hrefWith(q: string, batch: string, cls = "") {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (batch) params.set("batch", batch);
  if (cls) params.set("class", cls);
  const s = params.toString();
  return s ? `/students?${s}` : "/students";
}

function FilterChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
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
