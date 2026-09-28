"use client";

import { useEffect, useState } from "react";
import { Download, Share, SquarePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Chrome / Edge / Samsung fire this when the site can be installed. */
type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const DISMISS_KEY = "td-install-dismissed";

function isInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIPhone() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * "Install TuitionDesk as an app" card.
 * - Android: one tap on Install (the browser's own install dialog).
 * - iPhone: Safari has no install button, so we show the 2 steps.
 * Hidden once installed. On Home it can be closed; in More it always shows.
 */
export function InstallApp({ variant = "banner" }: { variant?: "banner" | "row" }) {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [mode, setMode] = useState<"hidden" | "prompt" | "ios" | "manual">("hidden");
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    if (isInstalled()) return;
    let dismissed = false;
    try {
      dismissed = variant === "banner" && localStorage.getItem(DISMISS_KEY) === "1";
    } catch {}
    if (dismissed) return;

    // On a phone we can always show something: install button, iPhone steps, or menu steps
    const phone = window.matchMedia("(max-width: 1023px)").matches;
    const initial = isIPhone() ? "ios" : variant === "row" || phone ? "manual" : "hidden";
    const timer = setTimeout(() => setMode((m) => (m === "hidden" ? initial : m)), 0);

    const onPrompt = (e: Event) => {
      e.preventDefault(); // we show our own button instead of the browser's mini bar
      setPromptEvent(e as InstallPromptEvent);
      setMode("prompt");
    };
    const onInstalled = () => setMode("hidden");
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [variant]);

  if (mode === "hidden") return null;

  async function install() {
    if (mode === "prompt" && promptEvent) {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === "accepted") setMode("hidden");
      setPromptEvent(null);
    } else {
      setShowSteps((v) => !v);
    }
  }

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
    setMode("hidden");
  }

  return (
    <section
      className={cn(
        "relative isolate overflow-hidden rounded-2xl p-4 ring-1",
        variant === "banner"
          ? "bg-linear-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/25 ring-white/10 lg:hidden"
          : "bg-card shadow-sm ring-foreground/8",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl",
            variant === "banner" ? "bg-white/15" : "bg-accent text-accent-foreground",
          )}
        >
          <Download className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base leading-snug font-bold">Install TuitionDesk</p>
          <p className={cn("text-sm", variant === "banner" ? "text-white/85" : "text-muted-foreground")}>
            Open it from your home screen like an app.
          </p>
        </div>
        {variant === "banner" && (
          <button
            type="button"
            onClick={dismiss}
            aria-label="Not now"
            className="-mt-1 -mr-1 flex size-9 shrink-0 items-center justify-center self-start rounded-lg text-white/80 hover:bg-white/10"
          >
            <X className="size-5" aria-hidden />
          </button>
        )}
      </div>

      <Button
        onClick={install}
        size="lg"
        className={cn(
          "mt-3 w-full",
          variant === "banner" && "bg-white text-indigo-700 hover:bg-white/90",
        )}
      >
        <Download aria-hidden /> {mode === "prompt" ? "Install app" : showSteps ? "Hide steps" : "How to install"}
      </Button>

      {showSteps && mode !== "prompt" && (
        <ol
          className={cn(
            "mt-3 grid gap-2 rounded-xl p-3 text-[0.95rem]",
            variant === "banner" ? "bg-white/12" : "bg-muted",
          )}
        >
          {mode === "ios" ? (
            <>
              <li className="flex items-center gap-2">
                <span className="font-bold">1.</span> Tap <Share className="inline size-4" aria-label="Share" /> Share at the
                bottom of Safari
              </li>
              <li className="flex items-center gap-2">
                <span className="font-bold">2.</span> Tap <SquarePlus className="inline size-4" aria-hidden /> Add to Home
                Screen
              </li>
            </>
          ) : (
            <>
              <li>
                <span className="font-bold">1.</span> Tap the browser menu <b>⋮</b> (top right)
              </li>
              <li>
                <span className="font-bold">2.</span> Tap <b>Install app</b> or <b>Add to Home screen</b>
              </li>
            </>
          )}
        </ol>
      )}
    </section>
  );
}
