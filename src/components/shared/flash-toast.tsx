"use client";

import { useEffect } from "react";
import { toast } from "sonner";

const MESSAGES: Record<string, string> = {
  "password=changed": "Password changed. Use it next time you log in.",
};

/** Shows a one-time toast for a ?key=value left in the URL by a redirect, then removes it. */
export function FlashToast() {
  useEffect(() => {
    const url = new URL(window.location.href);
    for (const [key, value] of [...url.searchParams]) {
      const message = MESSAGES[`${key}=${value}`];
      if (!message) continue;
      toast.success(message);
      url.searchParams.delete(key);
      window.history.replaceState(null, "", url);
    }
  }, []);
  return null;
}
