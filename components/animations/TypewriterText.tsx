"use client";

import { useEffect, useState } from "react";

type Props = {
  text: string;
  /** Set true to begin typing. */
  start: boolean;
  /** Ms per character (default 28). */
  speed?: number;
  className?: string;
};

/**
 * Reveals `text` character-by-character once `start` flips to true.
 * Not-yet-typed characters render with `visibility: hidden` so the final
 * layout height/width is reserved from frame zero (no reflow).
 */
export function TypewriterText({ text, start, speed = 28, className }: Props) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!start) {
      setShown(0);
      return;
    }
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= text.length) clearInterval(t);
    }, speed);
    return () => clearInterval(t);
  }, [start, text, speed]);

  return (
    <span className={className} aria-label={text}>
      {text.split("").map((ch, i) => (
        <span
          key={i}
          aria-hidden
          style={{ visibility: i < shown ? "visible" : "hidden" }}
        >
          {ch}
        </span>
      ))}
    </span>
  );
}
