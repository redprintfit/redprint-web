"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { WEB_APP_URL } from "@/lib/constants";
import { scrollToTop, scrollToVh } from "@/lib/lenis";
import { SCROLL_TARGETS } from "@/lib/scrollTargets";
import { DownloadModal } from "@/components/DownloadModal";
import { ContactModal } from "@/components/ContactModal";
import { MobileMenuDrawer } from "@/components/MobileMenuDrawer";

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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

  // "How it works" — on desktop scroll-sequence the target is moment 13
  // (vh 1360). On mobile the same vh value lands somewhere inside the
  // mobile page's vertical scroll, which has its own #mobile-hiw anchor.
  // We try the anchor first; if not found we fall back to the desktop
  // vh target.
  const scrollToSection = (anchorId: string, desktopVh: number) => {
    const el = document.getElementById(anchorId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      scrollToVh(desktopVh);
    }
  };

  const handleHowItWorks = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (pathname === "/") {
      scrollToSection("mobile-hiw", SCROLL_TARGETS.howItWorks);
    } else {
      router.push("/#hiw");
    }
  };
  const handleTestimonials = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (pathname === "/") {
      scrollToSection("mobile-testimonials", SCROLL_TARGETS.testimonials);
    } else {
      router.push("/#testimonials");
    }
  };
  // Drawer-button handlers (no event object — these get wrapped by the
  // drawer's `wrap()` helper which closes the drawer after the action).
  const onMobileHowItWorks = () =>
    pathname === "/"
      ? scrollToSection("mobile-hiw", SCROLL_TARGETS.howItWorks)
      : router.push("/#hiw");
  const onMobileTestimonials = () =>
    pathname === "/"
      ? scrollToSection("mobile-testimonials", SCROLL_TARGETS.testimonials)
      : router.push("/#testimonials");

  return (
    <nav className="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-center justify-between p-4 md:p-6">
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

      {/* Desktop nav — hidden below md. Identical to the previous design. */}
      <div className="pointer-events-auto hidden items-center gap-6 md:flex">
        <Link
          href="/#hiw"
          onClick={handleHowItWorks}
          className="text-fg-base hover:text-fg-base/70 text-sm font-semibold transition"
        >
          How it works
        </Link>
        <Link
          href="/#testimonials"
          onClick={handleTestimonials}
          className="text-fg-base hover:text-fg-base/70 text-sm font-semibold transition"
        >
          Testimonials
        </Link>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDownloadOpen(true)}
            className="border-fg-base/30 text-fg-base hover:bg-fg-base/10 inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold transition"
          >
            Download
          </button>
          <a
            href={WEB_APP_URL}
            className="bg-fg-base text-bg-base hover:bg-fg-base/90 inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition"
          >
            Sign in
          </a>
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile nav — Download pill + hamburger. Visible only below md. */}
      <div className="pointer-events-auto flex items-center gap-2 md:hidden">
        <button
          type="button"
          onClick={() => setDownloadOpen(true)}
          className="bg-fg-base text-bg-base hover:bg-fg-base/90 inline-flex items-center rounded-full px-3.5 py-2 text-sm font-semibold transition"
        >
          Download
        </button>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="text-fg-base hover:bg-fg-base/10 flex h-10 w-10 items-center justify-center rounded-full transition"
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
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {/* Modals + drawer — all hosted at the nav level so any surface
          can trigger them. Drawer is mobile-only; modals work on both. */}
      <DownloadModal
        open={downloadOpen}
        onClose={() => setDownloadOpen(false)}
      />
      <ContactModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
      />
      <MobileMenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onHowItWorks={onMobileHowItWorks}
        onTestimonials={onMobileTestimonials}
        onContact={() => setContactOpen(true)}
        onDownload={() => setDownloadOpen(true)}
      />
    </nav>
  );
}
