"use client";

import { useEffect } from "react";
import { scrollToTop, scrollToVh } from "@/lib/lenis";
import { HASH_TARGETS } from "@/lib/scrollTargets";

/**
 * Runs on every home-page mount and handles two cases:
 *   1. URL has a known hash (e.g. `/#hiw`, `/#testimonials`) → clears
 *      the hash and smooth-scrolls to that named target. Lets nav
 *      buttons deep-link from other routes.
 *   2. URL has no hash → force-scrolls to the top (immediate, no
 *      animation). This catches back-navigation from another route
 *      where Next.js would otherwise restore the previous scroll
 *      position — which lands the user mid-way through the
 *      5000+ vh scroll sequence and renders an incoherent frozen
 *      snapshot (Hero phone hovering over the request-gym form
 *      bleeding through, etc).
 */
export function HashScrollTarget() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    const target = HASH_TARGETS[hash];

    // Two rAFs in both branches: first lets React commit, second lets
    // LenisProvider's effect (which publishes the Lenis instance) run,
    // so scrollTo finds a live instance instead of falling back to
    // native scroll.
    if (target !== undefined) {
      // Strip the hash without triggering navigation so a refresh
      // won't re-scroll the user.
      history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToVh(target);
        });
      });
    } else {
      // No hash → reset to top. Immediate (no animation) so the user
      // sees the Hero, not a brief auto-scroll-up animation from mid-page.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToTop({ immediate: true });
        });
      });
    }
  }, []);
  return null;
}
