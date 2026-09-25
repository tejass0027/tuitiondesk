import type { Metadata } from "next";
import { GraduationCap, Users, UserX } from "lucide-react";
import { getCentre } from "@/lib/auth";
import { compareClassNames } from "@/lib/classes";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AddClassForm, ClassTile } from "./class-controls";

export const metadata: Metadata = { title: "Classes" };

export default async function ClassesPage() {
  const { supabase } = await getCentre();
  const [{ data: classes }, { data: students }] = await Promise.all([
    supabase.from("classes").select("id, name, sort_order").order("sort_order").order("name"),
    supabase.from("students").select("class").eq("is_active", true),
  ]);

  const list = [...(classes ?? [])].sort((a, b) => a.sort_order - b.sort_order || compareClassNames(a.name, b.name));
  const countFor = (name: string) =>
    (students ?? []).filter((s) => s.class.trim().toLowerCase() === name.toLowerCase()).length;
  const inAClass = list.reduce((sum, c) => sum + countFor(c.name), 0);
  const withoutClass = (students ?? []).length - inAClass;

  return (
    <>
      <PageHeader title="Classes" backHref="/more" description="The classes you teach, all in one place." />

      <div className="grid grid-cols-1 gap-6">
        {list.length > 0 && (
          <dl className="grid grid-cols-3 gap-2">
            <Stat icon={GraduationCap} label="Classes" value={list.length} />
            <Stat icon={Users} label="Students" value={inAClass} />
            <Stat icon={UserX} label="No class" value={withoutClass} muted={withoutClass === 0} />
          </dl>
        )}

        <AddClassForm />

        {list.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="Add the classes you teach"
            description="Type a class above, like “Class 10” or “JEE”. Then pick it when adding students, and filter students and fees by class."
          />
        ) : (
          <section>
            <h2 className="mb-3 text-lg font-bold">Your classes</h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {list.map((c, i) => (
                <ClassTile key={c.id} id={c.id} name={c.name} studentCount={countFor(c.name)} index={i} />
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  muted,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  muted?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-card p-3 shadow-sm ring-1 ring-foreground/8">
      <dt className="flex items-center gap-1.5 text-xs font-semibold tracking-wide whitespace-nowrap text-muted-foreground uppercase">
        <Icon className="hidden size-3.5 sm:block" aria-hidden /> {label}
      </dt>
      <dd className={muted ? "mt-1 text-2xl font-extrabold text-muted-foreground" : "mt-1 text-2xl font-extrabold"}>
        {value}
      </dd>
    </div>
  );
}
