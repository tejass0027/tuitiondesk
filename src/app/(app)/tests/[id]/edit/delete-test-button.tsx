"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
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
import { deleteTest } from "../../actions";

export function DeleteTestButton({ testId, testName }: { testId: string; testName: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="lg" disabled={pending}>
          <Trash2 aria-hidden /> Delete test
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{testName}”?</AlertDialogTitle>
          <AlertDialogDescription>All marks for this test will be deleted too. This can’t be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep test</AlertDialogCancel>
          <AlertDialogAction
            variant="danger"
            onClick={() =>
              startTransition(async () => {
                const result = await deleteTest(testId);
                if (result?.ok) {
                  toast.success(result.message);
                  router.push("/tests");
                } else {
                  toast.error(result?.message ?? "Could not delete the test");
                }
              })
            }
          >
            Delete forever
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
