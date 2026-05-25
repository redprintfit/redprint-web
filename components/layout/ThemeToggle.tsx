"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

/**
 * Two-state dark/light toggle. The pre-hydration script in
 * app/layout.tsx always sets a data-theme attribute on <html> before
 * paint; this component just reads it on mount and flips on click.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "light" ? "light" : "dark");
  }, []);

  const toggle = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    setTheme(next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Ignore (private mode, etc.).
    }
  };

  // Render a same-sized placeholder until mounted to avoid layout shift.
  if (theme === null) {
    return <div aria-hidden className="h-9 w-9" />;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className="text-fg-base border-fg-base/20 hover:bg-fg-base/10 flex h-9 w-9 items-center justify-center rounded-full border transition"
    >
      {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
