"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { InitialsAvatar } from "@/components/shared/initials-avatar";
import { createClient } from "@/lib/supabase/client";
import { PHOTO_BUCKET } from "@/lib/photos";
import { cn } from "@/lib/utils";
import { removeStudentPhoto, setStudentPhoto } from "../actions";

const SIZE = 480; // px, square

/** Centre-crops any photo to a small square JPEG, so uploads are tiny (~40 KB) even from big phone cameras. */
async function toSquareJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  canvas
    .getContext("2d")!
    .drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not read the photo"))), "image/jpeg", 0.85),
  );
}

/** Tap the student's avatar to add, change or remove their photo. */
export function PhotoPicker({
  studentId,
  centreId,
  name,
  photoUrl,
}: {
  studentId: string;
  centreId: string;
  name: string;
  photoUrl: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<"upload" | "remove" | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a photo.");
      return;
    }
    setBusy("upload");
    try {
      const jpeg = await toSquareJpeg(file);
      // A new file name each time, so phones don't show the old cached photo
      const path = `${centreId}/${studentId}-${Date.now()}.jpg`;
      const { error } = await createClient()
        .storage.from(PHOTO_BUCKET)
        .upload(path, jpeg, { contentType: "image/jpeg", cacheControl: "3600" });
      if (error) throw error;
      const res = await setStudentPhoto(studentId, path);
      if (!res?.ok) throw new Error(res?.message);
      toast.success("Photo saved");
      setOpen(false);
      router.refresh();
    } catch (err) {
      console.error("Photo upload failed", err);
      toast.error("Could not save the photo. Please try again.");
    } finally {
      setBusy(null);
      if (input.current) input.current.value = "";
    }
  }

  async function remove() {
    setBusy("remove");
    const res = await removeStudentPhoto(studentId);
    setBusy(null);
    if (res?.ok) {
      toast.success(res.message);
      setOpen(false);
      router.refresh();
    } else toast.error(res?.message ?? "Could not remove the photo.");
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={photoUrl ? `Change ${name}'s photo` : `Add a photo of ${name}`}
          className="group relative shrink-0 rounded-full focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <InitialsAvatar name={name} photoUrl={photoUrl} className="size-20 text-2xl ring-4 ring-background" />
          <span className="absolute -right-0.5 -bottom-0.5 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-3 ring-card transition-transform group-hover:scale-110">
            <Camera className="size-4" aria-hidden />
          </span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-3xl px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <SheetHeader className="px-0">
          <SheetTitle className="text-2xl font-bold">{name}</SheetTitle>
          <SheetDescription className="text-base">
            A photo helps you recognise students in lists and on the attendance sheet. Only you can see it.
          </SheetDescription>
        </SheetHeader>

        <div className="grid justify-items-center gap-5">
          <InitialsAvatar name={name} photoUrl={photoUrl} className="size-40 text-5xl shadow-lg" />

          <label className="w-full">
            <input
              ref={input}
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={busy !== null}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(f);
              }}
            />
            <span
              className={cn(
                "flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary text-lg font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90",
                busy !== null && "pointer-events-none opacity-60",
              )}
            >
              {busy === "upload" ? (
                <Loader2 className="size-5 animate-spin" aria-hidden />
              ) : (
                <ImagePlus className="size-5" aria-hidden />
              )}
              {busy === "upload" ? "Saving photo…" : photoUrl ? "Change photo" : "Take or choose a photo"}
            </span>
          </label>

          {photoUrl && (
            <Button variant="ghost" size="lg" onClick={remove} disabled={busy !== null} className="w-full text-danger hover:text-danger">
              {busy === "remove" ? <Loader2 className="animate-spin" aria-hidden /> : <Trash2 aria-hidden />}
              Remove photo
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
