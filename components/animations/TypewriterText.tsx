"use client";

import { useEffect, useState } from "react";

type Props = {
  text: string;
  /** Set true to begin the sequence (blink → type → blink → fade out cursor). */
  start: boolean;
  /** Ms per character (default 42). */
  speed?: number;
  className?: string;
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
export function TypewriterText({ text, start, speed = 42, className }: Props) {
  const [shown, setShown] = useState(0);
  const [cursorOn, setCursorOn] = useState(false);

  useEffect(() => {
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
  }, [start, text, speed]);

  return (
    <span className={className} aria-label={text}>
      <span aria-hidden>{text.slice(0, shown)}</span>
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
      <span aria-hidden style={{ visibility: "hidden" }}>
        {text.slice(shown)}
      </span>
    </span>
  );
}
