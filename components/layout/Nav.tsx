"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { WEB_APP_URL } from "@/lib/constants";
import { scrollToTop, scrollToVh } from "@/lib/lenis";
import { SCROLL_TARGETS } from "@/lib/scrollTargets";

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  // Wordmark behaviour:
  //   - On any non-home route, the parent <Link> handles client-side
  //     navigation to "/" as normal.
  //   - On the home route ("/"), navigating is a no-op, so intercept
  //     the click and smooth-scroll to the very top via Lenis instead.
  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/") {
      e.preventDefault();
      scrollToTop();
    }
  };
  // "How it works" button:
  //   - On home: smooth-scroll directly to moment 13 (top-left HOW IT
  //     WORKS menu fully formed, tags scaling in).
  //   - Elsewhere: navigate to "/#hiw"; HashScrollTarget on the home
  //     page reads the hash on mount and scrolls.
  const handleHowItWorks = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (pathname === "/") {
      scrollToVh(SCROLL_TARGETS.howItWorks);
    } else {
      router.push("/#hiw");
    }
  };
  return (
    <nav className="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-center justify-between p-4 md:p-6">
      {/* Top-left: full Redprint wordmark — rendered as a CSS mask so the
          single white asset adapts to currentColor (text-fg-base flips
          white in dark, dark in light). */}
      <Link
        href="/"
        aria-label="Redprint — back to top"
        onClick={handleLogoClick}
        className="text-fg-base pointer-events-auto block"
      >
        <div
          role="img"
          aria-label="Redprint"
          className="h-7 w-[120px] md:h-8 md:w-[140px]"
          style={{
            backgroundColor: "currentColor",
            WebkitMaskImage: "url(/logos/redprint-logo-full.png)",
            WebkitMaskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "left center",
            maskImage: "url(/logos/redprint-logo-full.png)",
            maskSize: "contain",
            maskRepeat: "no-repeat",
            maskPosition: "left center",
          }}
        />
      </Link>

      {/* Top-right: How it works + Pricing link + Sign in CTA + theme toggle */}
      <div className="pointer-events-auto flex items-center gap-6">
        <Link
          href="/#hiw"
          onClick={handleHowItWorks}
          className="text-fg-base hover:text-fg-base/70 text-sm font-semibold transition"
        >
          How it works
        </Link>
        <a
          href={WEB_APP_URL}
          className="bg-fg-base text-bg-base hover:bg-fg-base/90 inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition"
        >
          Sign in
        </a>
        <ThemeToggle />
      </div>
    </nav>
  );
}
