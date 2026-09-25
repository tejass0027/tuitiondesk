"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/** Adds the `dark` class to <html> when dark mode is on (light / dark / system). */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
