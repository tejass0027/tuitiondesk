"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, UserCheck, UserMinus } from "lucide-react";
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
import type { ActionState } from "@/lib/action-state";
import { deleteStudent, setStudentActive } from "../../actions";

type Props = { studentId: string; studentName: string; isActive: boolean };

/** "Mark as left" keeps history; "Delete" removes the student and all their records. */
export function StudentDangerZone({ studentId, studentName, isActive }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(task: () => Promise<ActionState>, goTo?: string) {
    startTransition(async () => {
      const result = await task();
      if (result?.ok) {
        toast.success(result.message);
        if (goTo) router.push(goTo);
      } else {
        toast.error(result?.message ?? "Something went wrong");
      }
    });
  }

  return (
    <section className="mt-10 grid gap-3 border-t pt-8">
      <h2 className="text-lg font-bold">Manage student</h2>

      <Button
        variant="outline"
        size="lg"
        disabled={pending}
        onClick={() => run(() => setStudentActive(studentId, !isActive), `/students/${studentId}`)}
      >
        {isActive ? <UserMinus aria-hidden /> : <UserCheck aria-hidden />}
        {isActive ? "Mark as left" : "Student has rejoined"}
      </Button>
      <p className="text-sm text-muted-foreground">
        {isActive
          ? "Stops new monthly fees and hides them from attendance. Their history is kept."
          : "Monthly fees and attendance start again for this student."}
      </p>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="lg" disabled={pending} className="mt-2">
            <Trash2 aria-hidden /> Delete student
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {studentName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This also deletes their attendance, fee and payment records. It can’t be undone. If they
              just stopped coming, use “Mark as left” instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep student</AlertDialogCancel>
            <AlertDialogAction
              variant="danger"
              onClick={() => run(() => deleteStudent(studentId), "/students")}
            >
              Delete forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
