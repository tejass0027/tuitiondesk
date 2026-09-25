import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";
import { getCentre } from "@/lib/auth";
import { compareClassNames } from "@/lib/classes";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AddClassForm, ClassRow } from "./class-controls";

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

  return (
    <>
      <PageHeader
        title="Classes"
        backHref="/more"
        description={list.length ? `${list.length} ${list.length === 1 ? "class" : "classes"} in your centre` : undefined}
      />

      <div className="grid grid-cols-1 gap-6">
        {list.length === 0 && (
          <EmptyState
            icon={GraduationCap}
            title="Add the classes you teach"
            description="Set them up once. Then pick a class when adding students, and filter students and fees by class."
          />
        )}

        <section className="grid gap-3 rounded-3xl bg-card p-5 shadow-sm ring-1 ring-foreground/8">
          <h2 className="text-lg font-bold">Add a class</h2>
          <AddClassForm />
        </section>

        {list.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-bold">Your classes</h2>
            <ul className="grid grid-cols-1 gap-2">
              {list.map((c) => (
                <ClassRow key={c.id} id={c.id} name={c.name} studentCount={countFor(c.name)} />
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
