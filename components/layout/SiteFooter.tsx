const PRODUCT_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "For gyms", href: "#for-gyms" },
  { label: "Web app", href: "#web-app" },
  { label: "Pricing", href: "#pricing" },
];

const COMPANY_LINKS = [
  // { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
  // { label: "Press", href: "#press" },
];

const SOCIAL_LINKS: { label: string; href: string; icon: React.ReactNode }[] = [
  {
    label: "Instagram",
    href: "#",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: "TikTok",
    href: "#",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M19 8.5a6 6 0 0 1-4-1.5v8.2a5.3 5.3 0 1 1-5.3-5.3c.35 0 .68.04 1 .11v2.78a2.55 2.55 0 1 0 1.78 2.43V3h2.5a3.5 3.5 0 0 0 4 3.5v2Z" />
      </svg>
    ),
  },
  // {
  //   label: "X",
  //   href: "#",
  //   icon: (
  //     <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
  //       <path d="M18.244 2H21.5l-7.5 8.572L23 22h-6.844l-5.36-7.013L4.7 22H1.44l8.04-9.186L1 2h7.02l4.85 6.412L18.244 2Zm-1.2 18h1.892L7.05 4H5.02l12.024 16Z" />
  //     </svg>
  //   ),
  // },
  {
    label: "LinkedIn",
    href: "#",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5ZM.22 8h4.56V22H.22V8Zm7.62 0h4.37v1.92h.06c.61-1.15 2.1-2.36 4.32-2.36 4.62 0 5.47 3.04 5.47 6.99V22h-4.56v-6.18c0-1.47-.03-3.37-2.05-3.37-2.05 0-2.37 1.6-2.37 3.26V22H7.84V8Z" />
      </svg>
    ),
  },
];

// Vertical stack: QR image on top, store badge below. QR is sized
// so its width matches the badge width (set on the wrapper) so the
// two elements look like one column.
// QR and button widths are independent — tune each via the constants
// below. Parent column centers them horizontally so they stack neatly
// even when their widths differ.
const STORE_QR_SIZE = 160;
const STORE_BUTTON_WIDTH = 160;

function StoreColumn({
  qrSrc,
  qrAlt,
  store,
}: {
  qrSrc: string;
  qrAlt: string;
  store: "app" | "play";
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="rounded-lg bg-black p-2 light:bg-white"
        style={{ width: STORE_QR_SIZE, height: STORE_QR_SIZE }}
      >
        <img
          src={qrSrc}
          alt={qrAlt}
          className="h-full w-full object-contain invert light:invert-0"
          draggable={false}
        />
      </div>
      <div
        className="flex items-center justify-center gap-2 rounded-lg bg-[#F5F1EA] px-3 py-2 light:bg-[#0B0B0D]"
        style={{ width: STORE_BUTTON_WIDTH }}
      >
        {store === "app" ? (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            aria-hidden
            className="shrink-0 fill-[#0B0B0D] light:fill-[#F5F1EA]"
          >
            <path d="M17.564 12.65c-.025-2.62 2.143-3.876 2.241-3.939-1.222-1.785-3.124-2.029-3.802-2.058-1.62-.164-3.16.954-3.984.954-.825 0-2.094-.93-3.443-.905-1.77.026-3.402 1.029-4.314 2.612-1.838 3.183-.471 7.901 1.319 10.488.878 1.269 1.92 2.696 3.279 2.644 1.32-.054 1.815-.854 3.41-.854 1.595 0 2.04.854 3.43.823 1.42-.025 2.318-1.287 3.186-2.566 1.006-1.475 1.422-2.91 1.447-2.985-.032-.014-2.766-1.062-2.794-4.214M14.992 5.07c.73-.886 1.222-2.111 1.087-3.337-1.052.043-2.322.7-3.078 1.585-.677.785-1.27 2.044-1.111 3.244 1.175.09 2.371-.595 3.102-1.492" />
          </svg>
        ) : (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            aria-hidden
            className="shrink-0 fill-[#0B0B0D] light:fill-[#F5F1EA]"
          >
            <path d="M3.609 1.814 13.792 12 3.61 22.186a.997.997 0 0 1-.609-.919V2.733a.997.997 0 0 1 .609-.919Z" />
            <path d="m14.5 11.293 2.886-2.886-12.7-7.21c-.13-.074-.28-.06-.397.025L14.5 11.293Z" />
            <path d="m14.5 12.707 2.886 2.886-12.7 7.21c-.13.074-.28.06-.397-.025L14.5 12.707Z" />
            <path d="m18.299 8.844 2.972 1.688a1 1 0 0 1 0 1.738l-2.972 1.687L15.207 12l3.092-3.156Z" />
          </svg>
        )}
        <div>
          <div className="whitespace-nowrap text-[8px] uppercase tracking-[0.05em] text-[#0B0B0D]/70 light:text-[#F5F1EA]/70">
            {store === "app" ? "Download on the" : "Get it on"}
          </div>
          <div className="text-sm font-semibold leading-tight tracking-tight text-[#0B0B0D] light:text-[#F5F1EA]">
            {store === "app" ? "App Store" : "Google Play"}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-black px-8 pb-8 pt-[72px] light:bg-white sm:px-16 sm:pt-20">
      {/* Grain overlay — only active in dark mode where the original
          design intended; would muddy the cream light-mode bg. */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-60 light:hidden"
        aria-hidden
      >
        <filter id="grain-footer">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.18 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-footer)" />
      </svg>

      <div className="relative z-10 mx-auto max-w-[1280px]">
        {/* Brand header — wordmark + tagline above the link/QR grid.
            Wordmark uses the same CSS-mask + currentColor trick as
            the Nav so it flips cream → dark with the theme. */}
        <div className="mb-12 text-[#F5F1EA] light:text-[#0B0B0D]">
          <div
            role="img"
            aria-label="Redprint"
            className="h-8 w-[140px] md:h-9 md:w-[160px]"
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
          <p className="mt-4 max-w-[420px] text-[15px] leading-relaxed text-[#C7C7CC] light:text-[#3a3a3f]">
            Fitness AI that knows your gym.
          </p>
        </div>

        <div className="mb-14 grid gap-12 lg:grid-cols-[1fr_1fr_1fr_460px]">
          {/* Product */}
          <div>
            <div className="mb-5 text-[11px] font-medium tracking-[0.14em] text-[#7A7A80] light:text-[#5a5a60]">
              PRODUCT
            </div>
            <div className="flex flex-col gap-[14px]">
              {PRODUCT_LINKS.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className="text-sm text-[#F5F1EA] transition-opacity hover:opacity-80 light:text-[#0B0B0D]"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <div className="mb-5 text-[11px] font-medium tracking-[0.14em] text-[#7A7A80] light:text-[#5a5a60]">
              COMPANY
            </div>
            <div className="flex flex-col gap-[14px]">
              {COMPANY_LINKS.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className="text-sm text-[#F5F1EA] transition-opacity hover:opacity-80 light:text-[#0B0B0D]"
                >
                  {l.label}
                </a>
              ))}
              {/* <a
                href="#careers"
                className="flex items-center gap-2 text-sm text-[#F5F1EA] transition-opacity hover:opacity-80 light:text-[#0B0B0D]"
              >
                Careers
                <span className="rounded bg-[#F5F1EA]/10 px-2 py-0.5 text-[10px] tracking-[0.05em] text-[#C7C7CC] light:bg-[#0B0B0D]/10 light:text-[#3a3a3f]">
                  HIRING
                </span>
              </a> */}
            </div>
          </div>

          {/* Connect */}
          <div>
            <div className="mb-5 text-[11px] font-medium tracking-[0.14em] text-[#7A7A80] light:text-[#5a5a60]">
              CONNECT
            </div>
            <div className="flex flex-col gap-[14px]">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="flex items-center gap-2.5 text-sm text-[#F5F1EA] transition-opacity hover:opacity-80 light:text-[#0B0B0D]"
                  aria-label={s.label}
                >
                  <span className="text-[#9C9CA3] light:text-[#5a5a60]">
                    {s.icon}
                  </span>
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* QR/badges column — right side, no brand header now
              that the wordmark lives above the grid. Shifted UP by
              ~10% of its own height so it visually aligns with the
              link columns to its left. */}
          <div className="flex -translate-y-[40%] translate-x-[10%] flex-col items-start gap-3">
            <div className="flex items-start gap-3">
              <StoreColumn
                qrSrc="/qr/redprint_app_store_qr.png"
                qrAlt="QR code — Download Redprint on the App Store"
                store="app"
              />
              <StoreColumn
                qrSrc="/qr/redprint_play_store_qr.png"
                qrAlt="QR code — Get Redprint on Google Play"
                store="play"
              />
            </div>

            <div className="mt-1 self-center text-[11px] tracking-[0.02em] text-[#7A7A80] light:text-[#5a5a60]">
              Scan a code to download on your phone
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 light:border-[#0B0B0D]/10 sm:flex-row sm:items-center">
          <div className="text-xs text-[#7A7A80] light:text-[#5a5a60]">
            © 2026 Redprint, Inc. All rights reserved.
          </div>
          <div className="flex gap-6">
            <a
              href="#privacy"
              className="text-xs text-[#7A7A80] transition-opacity hover:opacity-80 light:text-[#5a5a60]"
            >
              Privacy Policy
            </a>
            <a
              href="#terms"
              className="text-xs text-[#7A7A80] transition-opacity hover:opacity-80 light:text-[#5a5a60]"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
