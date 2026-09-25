import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Loads the signed-in owner and their centre. Wrapped in React `cache`
 * so the layout and the page share one lookup per request.
 * Signed-out visitors are sent to /login.
 */
export const getCentre = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: centre } = await supabase.from("centres").select("*").maybeSingle();
  if (!centre) redirect("/login?error=no-centre");

  return { supabase, user, centre };
});
