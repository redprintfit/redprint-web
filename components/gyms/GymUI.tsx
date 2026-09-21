"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { designerUrl } from "@/lib/gyms/tagDraft";

/**
 * Shared building blocks for the /for-gyms page: the scroll-reveal
 * wrapper, the eyebrow label, the laser headline, and the two CTAs.
 */

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  /** Seconds to hold before this block settles. */
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // No IntersectionObserver (very old browser) — show it rather than
    // leaving the content stuck at opacity 0.
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("in");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.06 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("reveal", className)}
      style={{ "--reveal-delay": `${delay}s` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

/** Small tracked uppercase label that heads every section. */
export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "font-body flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]",
        className,
      )}
      style={{ color: "var(--gym-accent)" }}
    >
      <span aria-hidden>▸</span>
      {children}
    </div>
  );
}

export type HeadlineLine = { text: string; accent?: boolean };

/** Same choreography as the home page's TypewriterText, in ms. */
const PRE_BLINK_MS = 600;
const POST_BLINK_STEPS_MS = [300, 600, 900] as const;

/**
 * Multi-line typewriter headline — the same treatment as the home page
 * hero ("Fitness AI that knows your gym"), extended to several lines
 * with one cursor that walks down them. Starts when the heading scrolls
 * into view; under prefers-reduced-motion the text just appears.
 *
 * Each line reserves its final width with a hidden tail, so the block
 * never reflows while typing.
 */
export function TypedHeadline({
  lines,
  as: Tag = "h1",
  className,
  speed = 42,
  id,
  onComplete,
}: {
  lines: HeadlineLine[];
  as?: "h1" | "h2";
  className?: string;
  /** Ms per character. */
  speed?: number;
  id?: string;
  /** Fires once, the moment the last character lands. */
  onComplete?: () => void;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [start, setStart] = useState(false);
  const [shown, setShown] = useState(0);
  const [cursorOn, setCursorOn] = useState(false);
  const total = lines.reduce((n, l) => n + l.text.length, 0);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Begin once the heading is on screen (once only).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      const t = setTimeout(() => setStart(true), 0);
      return () => clearTimeout(t);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setStart(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!start) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let interval: ReturnType<typeof setInterval> | null = null;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      timers.push(
        setTimeout(() => {
          setShown(total);
          setCursorOn(false);
          onCompleteRef.current?.();
        }, 0),
      );
      return () => timers.forEach(clearTimeout);
    }

    // 1. Cursor appears and blinks once: on → off → on.
    timers.push(setTimeout(() => setCursorOn(true), 0));
    timers.push(setTimeout(() => setCursorOn(false), PRE_BLINK_MS / 2));
    timers.push(
      setTimeout(() => {
        setCursorOn(true);
        // 2. Type across every line as one sequence.
        let i = 0;
        interval = setInterval(() => {
          i += 1;
          setShown(i);
          if (i >= total) {
            if (interval) clearInterval(interval);
            onCompleteRef.current?.();
            // 3. Post-blink: off → on → off, then stay hidden.
            const [a, b, c] = POST_BLINK_STEPS_MS;
            timers.push(setTimeout(() => setCursorOn(false), a));
            timers.push(setTimeout(() => setCursorOn(true), b));
            timers.push(setTimeout(() => setCursorOn(false), c));
          }
        }, speed);
      }, PRE_BLINK_MS),
    );

    return () => {
      timers.forEach(clearTimeout);
      if (interval) clearInterval(interval);
    };
  }, [start, total, speed]);

  // Character offset where each line begins, plus the line the cursor
  // sits on: the first line not yet fully typed, else the last line.
  const offsets: number[] = [];
  let activeIndex = lines.length - 1;
  let acc = 0;
  for (let i = 0; i < lines.length; i++) {
    offsets.push(acc);
    if (activeIndex === lines.length - 1 && shown < acc + lines[i].text.length) {
      activeIndex = i;
    }
    acc += lines[i].text.length;
  }

  const cursor = (
    <span
      aria-hidden
      className="inline-block"
      style={{
        width: "0.06em",
        height: "0.85em",
        marginLeft: "0.05em",
        backgroundColor: "currentColor",
        verticalAlign: "baseline",
        transform: "translateY(0.08em)",
        opacity: cursorOn ? 1 : 0,
      }}
    />
  );

  return (
    <Tag
      ref={ref}
      id={id}
      className={className}
      style={{ color: "var(--gym-fg)" }}
      aria-label={lines.map((l) => l.text).join(" ")}
    >
      {lines.map((line, i) => {
        const visible = Math.max(0, Math.min(line.text.length, shown - offsets[i]));
        return (
          <span
            key={line.text}
            aria-hidden
            className="block"
            style={{ color: line.accent ? "var(--gym-accent)" : undefined }}
          >
            {line.text.slice(0, visible)}
            {i === activeIndex && cursor}
            <span data-typed-tail style={{ visibility: "hidden" }}>
              {line.text.slice(visible)}
            </span>
          </span>
        );
      })}
    </Tag>
  );
}

/** Hero-sized typed headline. */
export function TypedHero({
  lines,
  className,
  id,
  speed,
  onComplete,
}: {
  lines: HeadlineLine[];
  className?: string;
  id?: string;
  speed?: number;
  onComplete?: () => void;
}) {
  return (
    <TypedHeadline
      as="h1"
      id={id}
      lines={lines}
      speed={speed}
      onComplete={onComplete}
      className={cn(
        "text-[clamp(38px,5.6vw,74px)] font-extrabold leading-[1.02] tracking-[-0.035em]",
        className,
      )}
    />
  );
}

/** Section-sized typed heading. */
export function TypedHeading({
  lines,
  className,
}: {
  lines: HeadlineLine[];
  className?: string;
}) {
  return (
    <TypedHeadline
      as="h2"
      lines={lines}
      className={cn(
        "text-[clamp(30px,4vw,52px)] font-extrabold leading-[1.05] tracking-[-0.03em]",
        className,
      )}
    />
  );
}

const ARROW = (
  <svg
    aria-hidden
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="shrink-0"
  >
    <polyline points="9 6 15 12 9 18" />
  </svg>
);

/**
 * Primary CTA. Ordering lives in the web app (separate repo), so this
 * is an outbound link rather than an in-page flow.
 */
export function OrderTagsButton({
  className,
  label = "Get Redprint in your gym",
  full = false,
}: {
  className?: string;
  label?: string;
  full?: boolean;
}) {
  return (
    <a
      href={designerUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group inline-flex items-center justify-between gap-3 rounded-xl px-6 py-4 text-[17px] font-bold transition",
        "hover:brightness-110 active:scale-[0.99]",
        full ? "w-full" : "w-auto",
        className,
      )}
      style={{
        backgroundColor: "var(--gym-accent)",
        color: "var(--gym-accent-ink)",
        boxShadow: "0 10px 30px -10px var(--gym-accent)",
      }}
    >
      {label}
      <span className="transition-transform group-hover:translate-x-0.5">{ARROW}</span>
    </a>
  );
}

/** Secondary, outline CTA. */
export function GhostButton({
  children,
  onClick,
  href,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
}) {
  const cls = cn(
    "inline-flex items-center justify-center gap-2 rounded-xl border px-6 py-4 text-[16px] font-semibold transition hover:bg-[var(--gym-surface-strong)]",
    className,
  );
  const style = { borderColor: "var(--gym-border)", color: "var(--gym-fg)" };
  if (href) {
    return (
      <a href={href} className={cls} style={style}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls} style={style}>
      {children}
    </button>
  );
}
