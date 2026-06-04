"use client";

import { useEffect, useState } from "react";
import { type MotionValue } from "framer-motion";

type Props = {
  text: string;
  /** Set true to begin the sequence (blink → type → blink → fade out cursor). */
  start: boolean;
  /** Ms per character (default 42). */
  speed?: number;
  className?: string;
  /**
   * Optional scroll-tied progress MotionValue (0 → 1). When provided, the
   * `start` / `speed` time-based path is bypassed entirely — chars appear
   * in direct proportion to the value. Cursor stays visible while
   * progress is strictly between 0 and 1, then hides.
   */
  progress?: MotionValue<number>;
  /**
   * When true, characters appear from the END of the string toward the
   * START (i.e., the suffix grows leftward). Pairs with right-aligned
   * text so chars accumulate toward the trailing edge.
   */
  reverse?: boolean;
};

/**
 * Typewriter with a blinking cursor.
 *
 * Sequence when `start` becomes true:
 *  1. Cursor appears solidly, blinks once (~600ms) — on → off → on
 *  2. Types characters at `speed` ms each, cursor riding at the typing point
 *  3. After last character, cursor blinks once more — off → on → off
 *  4. Cursor stays hidden
 *
 * Reserves final-layout width via a visibility:hidden tail span so the
 * surrounding layout doesn't reflow while typing.
 */
export function TypewriterText({
  text,
  start,
  speed = 42,
  className,
  progress,
  reverse = false,
}: Props) {
  const [shown, setShown] = useState(0);
  const [cursorOn, setCursorOn] = useState(false);

  // Scroll-tied path. When `progress` is supplied, the typewriter mirrors
  // it directly — shown chars = round(text.length * p), cursor visible
  // mid-type, hidden at the bounds.
  useEffect(() => {
    if (!progress) return;
    const apply = (p: number) => {
      const c = Math.max(0, Math.min(1, p));
      setShown(Math.round(text.length * c));
      setCursorOn(c > 0 && c < 1);
    };
    apply(progress.get());
    return progress.on("change", apply);
  }, [progress, text]);

  // Time-based path. Skipped entirely when a scroll progress MV is
  // controlling typing — we'd otherwise have two effects fighting over
  // `shown`.
  useEffect(() => {
    if (progress) return;
    if (!start) {
      setShown(0);
      setCursorOn(false);
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    let typingInterval: ReturnType<typeof setInterval> | null = null;

    // 1. Cursor appears, blinks once (on 300ms → off 300ms → on)
    setCursorOn(true);
    timers.push(setTimeout(() => setCursorOn(false), 300));
    timers.push(
      setTimeout(() => {
        setCursorOn(true);

        // 2. Type characters
        let i = 0;
        typingInterval = setInterval(() => {
          i += 1;
          setShown(i);
          if (i >= text.length) {
            if (typingInterval) clearInterval(typingInterval);
            // 3. Post-blink: off 300ms → on 300ms → off (done)
            timers.push(setTimeout(() => setCursorOn(false), 300));
            timers.push(setTimeout(() => setCursorOn(true), 600));
            timers.push(setTimeout(() => setCursorOn(false), 900));
          }
        }, speed);
      }, 600),
    );

    return () => {
      timers.forEach(clearTimeout);
      if (typingInterval) clearInterval(typingInterval);
    };
  }, [start, text, speed, progress]);

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

  if (reverse) {
    // Hidden PREFIX on the left reserves layout space; cursor sits at
    // the typing point (just before the visible suffix); visible
    // SUFFIX grows leftward as chars are typed in from the end.
    const hidden = text.slice(0, text.length - shown);
    const visible = text.slice(text.length - shown);
    return (
      <span className={className} aria-label={text}>
        <span aria-hidden style={{ visibility: "hidden" }}>
          {hidden}
        </span>
        {cursor}
        <span aria-hidden>{visible}</span>
      </span>
    );
  }

  return (
    <span className={className} aria-label={text}>
      <span aria-hidden>{text.slice(0, shown)}</span>
      {cursor}
      <span aria-hidden style={{ visibility: "hidden" }}>
        {text.slice(shown)}
      </span>
    </span>
  );
}
