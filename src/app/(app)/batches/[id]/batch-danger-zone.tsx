"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { deleteBatch, setBatchActive } from "../actions";

type Props = { batchId: string; batchName: string; isActive: boolean; studentCount: number };

/** Archive (keeps history) or delete (only when empty) a batch. */
export function BatchDangerZone({ batchId, batchName, isActive, studentCount }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(task: () => Promise<{ ok: boolean; message?: string } | null>, goBack = false) {
    startTransition(async () => {
      const result = await task();
      if (result?.ok) {
        toast.success(result.message);
        if (goBack) router.push("/batches");
      } else {
        toast.error(result?.message ?? "Something went wrong");
      }
    });
  }

  return (
    <section className="mt-10 grid gap-3 border-t pt-8">
      <h2 className="text-lg font-bold">Manage batch</h2>

      <Button
        variant="outline"
        size="lg"
        disabled={pending}
        onClick={() => run(() => setBatchActive(batchId, !isActive))}
      >
        {isActive ? <Archive aria-hidden /> : <ArchiveRestore aria-hidden />}
        {isActive ? "Archive batch" : "Make batch active again"}
      </Button>
      <p className="text-sm text-muted-foreground">
        {isActive
          ? "Archived batches are hidden from attendance but keep all their history."
          : "This batch is archived and hidden from attendance."}
      </p>

      {studentCount === 0 && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="lg" disabled={pending} className="mt-2">
              <Trash2 aria-hidden /> Delete batch
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete “{batchName}”?</AlertDialogTitle>
              <AlertDialogDescription>
                This can’t be undone. The batch has no students, so nothing else is lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep it</AlertDialogCancel>
              <AlertDialogAction
                className="bg-danger text-background hover:bg-danger/90"
                onClick={() => run(() => deleteBatch(batchId), true)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </section>
  );
}
