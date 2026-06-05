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
 * `initialView` comes from server-side User-Agent detection in
 * app/page.tsx, so SSR ships the correct tree for the visitor's
 * device — no flash of the wrong layout on first paint. The client
 * matchMedia listener still runs to handle browser-resize cases
 * (desktop narrowed below md, etc.).
 */
export function HomePageSwitcher({
  initialView,
}: {
  initialView: "mobile" | "desktop";
}) {
  const [view, setView] = useState<"mobile" | "desktop">(initialView);
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
