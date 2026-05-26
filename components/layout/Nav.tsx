import Link from "next/link";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { WEB_APP_URL } from "@/lib/constants";

export function Nav() {
  return (
    <nav className="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-center justify-between p-4 md:p-6">
      {/* Top-left: full Redprint wordmark — rendered as a CSS mask so the
          single white asset adapts to currentColor (text-fg-base flips
          white in dark, dark in light). */}
      <Link
        href="/"
        aria-label="Redprint"
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

      {/* Top-right: Pricing link + Sign in CTA + theme toggle */}
      <div className="pointer-events-auto flex items-center gap-6">
        <Link
          href="/pricing"
          className="text-fg-base hover:text-fg-base/70 text-sm font-semibold transition"
        >
          Pricing
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
