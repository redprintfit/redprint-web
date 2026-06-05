"use client";

import { useEffect, useState } from "react";
import { ScrollSequence } from "@/components/sections/ScrollSequence";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MobileHome } from "@/components/mobile/MobileHome";

/**
 * Renders the desktop ScrollSequence at md breakpoint and up, the
 * vertically-scrolling MobileHome below. Both trees never co-exist so
 * the desktop scroll choreography's heavy useScroll/useTransform work
 * never runs on phones.
 *
 * SSR default is mobile — phones see content on first paint without
 * waiting for hydration. On client mount we swap to desktop if the
 * viewport is wide enough. Wide-viewport users see a brief flash of
 * the mobile tree before desktop mounts; phone users see nothing
 * change. `suppressHydrationWarning` because the initial server tree
 * intentionally differs from the post-effect client tree.
 */
export function HomePageSwitcher() {
  const [view, setView] = useState<"mobile" | "desktop">("mobile");
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setView(mq.matches ? "mobile" : "desktop");
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (view === "mobile") {
    return <MobileHome />;
  }
  return (
    <>
      <ScrollSequence />
      <SiteFooter />
    </>
  );
}
