"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, GraduationCap, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useActionToast } from "@/hooks/use-action-toast";
import { CLASS_PRESETS } from "@/lib/classes";
import { addClass, addPreset, deleteClass, renameClass } from "./actions";

/** One-tap buttons: "Class 1 to 12", "PUC 1 & 2", … */
export function PresetButtons() {
  const [busy, setBusy] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {CLASS_PRESETS.map((p) => (
        <Button
          key={p.key}
          variant="outline"
          size="lg"
          disabled={busy !== null}
          className="h-auto min-h-14 min-w-0 justify-start px-3 py-2 text-left whitespace-normal"
          onClick={() => {
            setBusy(p.key);
            startTransition(async () => {
              const r = await addPreset(p.key);
              if (r?.ok) toast.success(r.message);
              else toast.error(r?.message ?? "Something went wrong");
              setBusy(null);
            });
          }}
        >
          {busy === p.key ? <Loader2 className="animate-spin" aria-hidden /> : <Plus aria-hidden />}
          <span className="flex min-w-0 flex-1 items-center justify-between gap-2 leading-tight">
            <span>{p.label}</span>
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              {p.names.length} {p.names.length === 1 ? "class" : "classes"}
            </span>
          </span>
        </Button>
      ))}
    </div>
  );
}

/** Type a name like "Class 10 (CBSE)" and add it. */
export function AddClassForm() {
  const [state, formAction, pending] = useActionState(addClass, null);
  const formRef = useRef<HTMLFormElement>(null);
  useActionToast(state, () => formRef.current?.reset());

  return (
    <form ref={formRef} action={formAction} className="flex gap-2" noValidate>
      <label htmlFor="class-name" className="sr-only">
        Class name
      </label>
      <Input
        id="class-name"
        name="name"
        placeholder="e.g. Class 10 (CBSE)"
        maxLength={40}
        defaultValue={state?.ok === false ? state.values?.name : undefined}
        aria-invalid={Boolean(state?.fieldErrors?.name)}
        className="flex-1"
        required
      />
      <Button type="submit" size="default" disabled={pending} className="shrink-0">
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Plus aria-hidden />} Add
      </Button>
    </form>
  );
}

/** A class in the list: tap the pencil to rename, the bin to remove. */
export function ClassRow({ id, name, studentCount }: { id: string; name: string; studentCount: number }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [pending, startTransition] = useTransition();

  function save() {
    if (value.trim() === name) return setEditing(false);
    startTransition(async () => {
      const r = await renameClass(id, value);
      if (r?.ok) {
        toast.success(r.message);
        setEditing(false);
      } else toast.error(r?.message ?? "Could not rename");
    });
  }

  return (
    <li className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-sm ring-1 ring-foreground/8">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25">
        <GraduationCap className="size-5" aria-hidden />
      </span>

      {editing ? (
        <form
          className="flex min-w-0 flex-1 items-center gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <Input
            autoFocus
            aria-label={`New name for ${name}`}
            value={value}
            maxLength={40}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && (setValue(name), setEditing(false))}
            className="h-11 min-w-0 flex-1"
          />
          <Button type="submit" size="icon-sm" disabled={pending} aria-label="Save name">
            {pending ? <Loader2 className="animate-spin" /> : <Check />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Cancel"
            onClick={() => (setValue(name), setEditing(false))}
          >
            <X />
          </Button>
        </form>
      ) : (
        <>
          <Link href={`/students?class=${encodeURIComponent(name)}`} className="min-w-0 flex-1 hover:underline">
            <span className="block truncate text-base font-semibold">{name}</span>
            <span className="block text-sm text-muted-foreground">
              {studentCount} {studentCount === 1 ? "student" : "students"}
            </span>
          </Link>
          <Button variant="ghost" size="icon-sm" aria-label={`Rename ${name}`} onClick={() => setEditing(true)}>
            <Pencil className="size-4.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Remove ${name}`} disabled={pending}>
                <Trash2 className="size-4.5 text-muted-foreground" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove “{name}” from the list?</AlertDialogTitle>
                <AlertDialogDescription>
                  {studentCount
                    ? `${studentCount} ${studentCount === 1 ? "student keeps" : "students keep"} “${name}” as their class. Only the list entry is removed.`
                    : "No students are in this class."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep it</AlertDialogCancel>
                <AlertDialogAction
                  variant="danger"
                  onClick={() =>
                    startTransition(async () => {
                      const r = await deleteClass(id);
                      if (r?.ok) toast.success(r.message);
                      else toast.error(r?.message ?? "Could not remove");
                    })
                  }
                >
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </li>
  );
}
