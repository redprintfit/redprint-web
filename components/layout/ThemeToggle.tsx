"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

/**
 * Two-state dark/light toggle that overrides the system color-scheme
 * preference. Persists choice in localStorage. The pre-hydration script
 * in app/layout.tsx applies the saved value before first paint to avoid
 * a flash; this component then takes over for runtime toggling.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      return;
    }
    setTheme(
      window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark",
    );
  }, []);

  const toggle = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Ignore (private mode, etc.).
    }
  };

  if (theme === null) {
    // Avoid hydration mismatch — render an empty placeholder of the same size.
    return <div aria-hidden className="h-9 w-9" />;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className="text-fg-base hover:bg-fg-base/10 flex h-9 w-9 items-center justify-center rounded-full transition"
    >
      {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
