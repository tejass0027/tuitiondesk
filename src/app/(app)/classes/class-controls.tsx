"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, Ellipsis, Loader2, Pencil, Plus, Trash2, Users, X } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useActionToast } from "@/hooks/use-action-toast";
import { classBadge } from "@/lib/classes";
import { cn } from "@/lib/utils";
import { addClass, deleteClass, renameClass } from "./actions";

/** A colour per tile, repeating in a fixed order so each class keeps its colour. */
const TONES = [
  "from-indigo-500 to-violet-600 shadow-indigo-500/30",
  "from-sky-500 to-blue-600 shadow-sky-500/30",
  "from-emerald-500 to-teal-600 shadow-emerald-500/30",
  "from-amber-500 to-orange-600 shadow-amber-500/30",
  "from-rose-500 to-pink-600 shadow-rose-500/30",
  "from-fuchsia-500 to-purple-600 shadow-fuchsia-500/30",
];

/** "Add a class" bar: icon, text box and a gradient Add button. */
export function AddClassForm() {
  const [state, formAction, pending] = useActionState(addClass, null);
  const formRef = useRef<HTMLFormElement>(null);
  useActionToast(state, () => formRef.current?.reset());

  return (
    <form
      ref={formRef}
      action={formAction}
      noValidate
      className="flex items-center gap-2 rounded-3xl bg-card p-2 shadow-sm ring-1 ring-foreground/8 focus-within:ring-2 focus-within:ring-primary/40"
    >
      <span className="ml-1 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
        <Plus className="size-5" aria-hidden />
      </span>
      <label htmlFor="class-name" className="sr-only">
        New class name
      </label>
      <input
        id="class-name"
        name="name"
        placeholder="Add a class…"
        maxLength={40}
        autoComplete="off"
        defaultValue={state?.ok === false ? state.values?.name : undefined}
        aria-invalid={Boolean(state?.fieldErrors?.name)}
        className="h-12 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
        required
      />
      <Button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-2xl bg-linear-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500"
      >
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : "Add"}
      </Button>
    </form>
  );
}

/** One class as a tile: big badge, name, student count, ⋯ menu for rename / remove. */
export function ClassTile({
  id,
  name,
  studentCount,
  index,
}: {
  id: string;
  name: string;
  studentCount: number;
  index: number;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [value, setValue] = useState(name);
  const [pending, startTransition] = useTransition();
  const tone = TONES[index % TONES.length];
  const studentsHref = `/students?class=${encodeURIComponent(name)}`;

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
    <li className="relative flex flex-col rounded-3xl bg-card p-4 shadow-sm ring-1 ring-foreground/8 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "flex h-14 min-w-14 items-center justify-center rounded-2xl bg-linear-to-br px-2 text-xl font-extrabold tracking-tight text-white shadow-lg",
            tone,
          )}
          aria-hidden
        >
          {classBadge(name)}
        </span>

        {!editing && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Options for ${name}`}
                className="relative z-10 -mt-1 -mr-1"
              >
                <Ellipsis className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuItem className="h-11 text-base" onSelect={() => setEditing(true)}>
                <Pencil /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="h-11 text-base">
                <Link href={studentsHref}>
                  <Users /> See students
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" className="h-11 text-base" onSelect={() => setConfirmDelete(true)}>
                <Trash2 /> Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {editing ? (
        <form
          className="mt-3 flex items-center gap-1.5"
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
        // The whole tile is tappable (the link stretches over it); the ⋯ button sits above it
        <Link
          href={studentsHref}
          className="mt-3 block after:absolute after:inset-0 after:rounded-3xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
        >
          <span className="block truncate text-lg leading-tight font-bold">{name}</span>
          <span
            className={cn(
              "mt-1 inline-flex items-center gap-1 text-sm font-medium",
              studentCount ? "text-foreground/80" : "text-muted-foreground",
            )}
          >
            <Users className="size-3.5" aria-hidden />
            {studentCount ? `${studentCount} ${studentCount === 1 ? "student" : "students"}` : "No students"}
          </span>
        </Link>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
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
    </li>
  );
}
