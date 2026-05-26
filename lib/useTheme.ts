"use client";

import { useEffect, useState } from "react";

/**
 * Returns "light" | "dark" reflecting the current `data-theme` attribute
 * on <html>. Updates live when the theme toggle changes it.
 *
 * SSR-safe: returns "dark" (the project default) until mount.
 *
 * Use only when a value can't be expressed via CSS — e.g., when an org-
 * color formula differs between themes (`lighten(c, 60)` in dark vs
 * `darken(c, 65)` in light). For static class swaps, prefer the `light:`
 * Tailwind variant.
 */
export function useTheme(): "light" | "dark" {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const read = (): "light" | "dark" =>
      document.documentElement.getAttribute("data-theme") === "light"
        ? "light"
        : "dark";
    setTheme(read());
    const observer = new MutationObserver(() => setTheme(read()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return theme;
}
