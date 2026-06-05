"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { WEB_APP_URL } from "@/lib/constants";

/**
 * Full-screen menu overlay opened by the mobile nav hamburger. Items
 * stack center; each is a large tap target. Closes on backdrop / X /
 * Esc / item selection. Reused across the mobile home page since it's
 * the only mobile-only navigation surface.
 */
export function MobileMenuDrawer({
  open,
  onClose,
  onHowItWorks,
  onTestimonials,
  onContact,
  onDownload,
}: {
  open: boolean;
  onClose: () => void;
  onHowItWorks: () => void;
  onTestimonials: () => void;
  onContact: () => void;
  onDownload: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  // Each handler dispatches the parent action AND closes the drawer so
  // the user sees their tap go through to the destination.
  const wrap = (fn: () => void) => () => {
    fn();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="bg-bg-base/95 pointer-events-auto fixed inset-0 z-[90] flex flex-col backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          {/* Close X — top right, aligned with where the hamburger sits. */}
          <div className="flex items-center justify-end p-4">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="text-fg-base hover:bg-fg-base/10 flex h-11 w-11 items-center justify-center rounded-full transition"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Menu items — Outfit display font for the big headings;
              keeps the page's display/body type pairing. */}
          <nav className="flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-16">
            <MenuItem onClick={wrap(onHowItWorks)}>How it works</MenuItem>
            <MenuItem onClick={wrap(onTestimonials)}>Testimonials</MenuItem>
            <MenuItem onClick={wrap(onContact)}>Contact us</MenuItem>
            <MenuItem onClick={wrap(onDownload)}>Download the app</MenuItem>
            <a
              href={WEB_APP_URL}
              className="text-fg-base hover:text-fg-base/70 font-body mt-4 text-base font-semibold transition"
            >
              Sign in
            </a>
            <div className="mt-2">
              <ThemeToggle />
            </div>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MenuItem({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-fg-base hover:text-fg-base/70 block py-2 text-center text-[2rem] font-black leading-none transition"
      style={{ fontWeight: 900 }}
    >
      {children}
    </button>
  );
}
