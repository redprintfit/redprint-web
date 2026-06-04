"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { setLenisInstance } from "@/lib/lenis";

gsap.registerPlugin(ScrollTrigger);

export function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Disable the browser's auto-restore on refresh/back-nav. The scroll
    // sequence drives every visible motion off `scrollYProgress`, so
    // landing the user mid-page after a refresh leaves the animation
    // in an arbitrary partial state (which is what causes the weird
    // unpredictable visuals on reload). Force scroll to (0,0) before
    // Lenis attaches so the page always starts from the top.
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);

    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
    });
    // Belt-and-braces — Lenis caches its own scroll value at init from
    // the window's current scroll position, so call its scrollTo(0)
    // with `immediate` right after construction to make sure both the
    // window AND Lenis agree we're at the top.
    lenis.scrollTo(0, { immediate: true });

    // Publish so Nav (and any other component) can drive smooth scrolls
    // through the same instance — e.g. clicking the toolbar logo on the
    // home page glides back to the top using the existing easing.
    setLenisInstance(lenis);

    lenis.on("scroll", ScrollTrigger.update);

    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    // Lenis caches maxScroll = body.scrollHeight - innerHeight on init
    // and recalculates only on `resize` events. Anything that changes
    // document height WITHOUT firing resize — HMR, async images,
    // dynamically-sized sections, font-load reflows — leaves Lenis
    // capped at the old (shorter) page height. Symptom: wheel scroll
    // stops responding before the actual page bottom even though the
    // scrollbar still works (scrollbar drag bypasses Lenis entirely).
    // ResizeObserver on the body catches every height change and tells
    // Lenis to re-measure.
    const observer = new ResizeObserver(() => lenis.resize());
    observer.observe(document.body);

    return () => {
      observer.disconnect();
      gsap.ticker.remove(tickerCallback);
      setLenisInstance(null);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
