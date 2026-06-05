"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/constants";

/**
 * App-download modal — opened by the Download button in the Nav. Shows
 * the same QR + store-pill design used in SiteFooter, but in a modal
 * that matches RequestGymModal's black/white palette. Headline uses the
 * default sans (Outfit); everything else uses Inter (`font-body`).
 */
export function DownloadModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  // Esc to close, body scroll lock while open.
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

  // Portal to <body> — see RequestGymModal for rationale (ancestor
  // transforms inside ScrollSequence break position:fixed otherwise).
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          // pointer-events-auto: defensive. data-lenis-prevent so Lenis
          // ignores wheel/touch events inside the modal subtree.
          data-lenis-prevent
          className="pointer-events-auto fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          aria-modal="true"
          role="dialog"
          aria-labelledby="download-modal-title"
        >
          {/* Backdrop — div not button (it's a dismiss-area gesture, not
              a button activation). onClick fires on any click outside
              the card; Esc handles keyboard dismiss elsewhere. */}
          <div
            aria-hidden
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          {/* Card. stopPropagation belt-and-braces: clicks inside the
              card don't reach the backdrop even if browser quirks
              treat the siblings differently. */}
          <motion.div
            onClick={(e) => e.stopPropagation()}
            className="relative w-[min(640px,92vw)] rounded-3xl bg-[#161616] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.55)] light:bg-[#ffffff] light:shadow-[0_24px_60px_rgba(0,0,0,0.12)]"
            initial={{ scale: 0.96, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 12 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Close X. z-10 keeps it above any sibling content that
                might inherit a stacking context. stopPropagation
                ensures the click does not double-fire on parents. */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              aria-label="Close"
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full text-[#ffffff]/70 transition hover:bg-[#ffffff]/10 hover:text-[#ffffff] light:text-[#0a0a0a]/60 light:hover:bg-[#0a0a0a]/10 light:hover:text-[#0a0a0a]"
            >
              <svg
                width="18"
                height="18"
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

            <header className="pr-8 text-center">
              <h2
                id="download-modal-title"
                className="text-[#ffffff] text-[1.5rem] font-black leading-tight light:text-[#0a0a0a]"
              >
                Download Redprint
              </h2>
              <p className="font-body text-[#ffffff]/70 mx-auto mt-2 max-w-[420px] text-sm light:text-[#0a0a0a]/70">
                Scan a code with your phone camera, or tap a button to install.
              </p>
            </header>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <StoreColumn
                store="app"
                qrSrc="/qr/redprint_app_store_qr.png"
                qrAlt="QR code — Download Redprint on the App Store"
                href={APP_STORE_URL}
              />
              <StoreColumn
                store="play"
                qrSrc="/qr/redprint_play_store_qr.png"
                qrAlt="QR code — Get Redprint on Google Play"
                href={PLAY_STORE_URL}
              />
            </div>

            <p className="font-body text-[#ffffff]/55 mt-5 text-center text-[11px] light:text-[#0a0a0a]/55">
              Free to download. Works at any gym, with or without Redprint tags
              installed.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ============================================================
   Per-store column: QR on a contrasting tile, store pill below.
   Mirrors components/layout/SiteFooter.tsx's StoreColumn so the
   visual language is identical across the site.
   ============================================================ */

const STORE_TILE_SIZE = 168;
const STORE_BUTTON_WIDTH = 168;

function StoreColumn({
  store,
  qrSrc,
  qrAlt,
  href,
}: {
  store: "app" | "play";
  qrSrc: string;
  qrAlt: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="font-body group flex flex-col items-center gap-2 rounded-2xl p-3 transition hover:bg-[#ffffff]/[0.04] light:hover:bg-[#0a0a0a]/[0.04]"
    >
      {/* QR tile — inverted color scheme so the code stays high-contrast
          in either theme: black tile in dark mode (and we invert the QR
          so the dark squares read white), white tile in light mode. */}
      <div
        className="rounded-lg bg-black p-2 light:bg-white"
        style={{ width: STORE_TILE_SIZE, height: STORE_TILE_SIZE }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrSrc}
          alt={qrAlt}
          className="h-full w-full object-contain invert light:invert-0"
          draggable={false}
        />
      </div>
      {/* Store pill — cream pill on dark card / dark pill on light card.
          Same shape + composition as SiteFooter's pills. */}
      <div
        className="flex items-center justify-center gap-2 rounded-lg bg-[#F5F1EA] px-3 py-2 transition group-hover:opacity-90 light:bg-[#0B0B0D]"
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
        <div className="text-left">
          <div className="whitespace-nowrap text-[8px] uppercase tracking-[0.05em] text-[#0B0B0D]/70 light:text-[#F5F1EA]/70">
            {store === "app" ? "Download on the" : "Get it on"}
          </div>
          <div className="text-sm font-semibold leading-tight tracking-tight text-[#0B0B0D] light:text-[#F5F1EA]">
            {store === "app" ? "App Store" : "Google Play"}
          </div>
        </div>
      </div>
    </a>
  );
}
