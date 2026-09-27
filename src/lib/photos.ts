import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/** Private storage bucket for student photos: <centre_id>/<student_id>-<time>.jpg */
export const PHOTO_BUCKET = "student-photos";

/**
 * Photo paths -> short-lived URLs the browser can show (the bucket is private).
 * One request for the whole list. Returns { path: url }.
 */
export async function signPhotoUrls(
  supabase: SupabaseClient<Database>,
  paths: (string | null | undefined)[],
): Promise<Record<string, string>> {
  const unique = [...new Set(paths.filter((p): p is string => Boolean(p)))];
  if (unique.length === 0) return {};
  const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(unique, 60 * 60);
  const urls: Record<string, string> = {};
  for (const d of data ?? []) if (d.path && d.signedUrl) urls[d.path] = d.signedUrl;
  return urls;
}

/** A photo path must sit in this centre's folder and be named after this student. */
export function isOwnPhotoPath(path: string, centreId: string, studentId: string): boolean {
  return path.startsWith(`${centreId}/${studentId}-`) && /-\d{10,16}\.jpg$/.test(path);
}
