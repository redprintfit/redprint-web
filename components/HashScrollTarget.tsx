"use client";

import { useEffect } from "react";
import { scrollToVh } from "@/lib/lenis";
import { HASH_TARGETS } from "@/lib/scrollTargets";

/**
 * Reads the URL hash on home-page mount. If it matches a named scroll
 * target (e.g. `/#hiw`), clears the hash from the URL and smooth-scrolls
 * to the corresponding absolute vh via Lenis. Lets the nav's "How it
 * works" button deep-link to a specific moment when the user is coming
 * from another route.
 */
export function HashScrollTarget() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    const target = HASH_TARGETS[hash];
    if (target === undefined) return;
    // Strip the hash without triggering navigation so a refresh won't
    // re-scroll the user.
    history.replaceState(null, "", window.location.pathname + window.location.search);
    // Two rAFs: first lets React commit, second lets LenisProvider's
    // effect (which publishes the Lenis instance) run, so scrollToVh
    // finds a live instance instead of falling back to native scroll.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToVh(target);
      });
    });
  }, []);
  return null;
}
