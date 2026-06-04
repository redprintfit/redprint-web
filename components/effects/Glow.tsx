import { cn } from "@/lib/utils";

/**
 * Soft coloured blob used inside sections for depth. Pure server
 * component — no interactivity, no client JS. Intended to sit inside a
 * `relative overflow-hidden` parent so it gets clipped to the section
 * (the glow itself is much larger than the section it accents).
 */
type Props = {
  /** Hex / CSS colour. Default "#A8E635" (Redprint lime). */
  color?: string;
  /** Width AND height in px. Default 600. */
  size?: number;
  /** CSS filter blur amount in px. Default 120. */
  blur?: number;
  /** 0..1, default 0.2. */
  opacity?: number;
  /** CSS positioning. Default top-centre. */
  position?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  className?: string;
};

export function Glow({
  color = "#A8E635",
  size = 600,
  blur = 120,
  opacity = 0.2,
  position = { top: "0", left: "50%" },
  className,
}: Props) {
  // When anchored to left:50% we auto-centre horizontally — saves the
  // caller from having to remember the translateX(-50%) idiom.
  const transform = position.left === "50%" ? "translateX(-50%)" : undefined;

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute rounded-full", className)}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        filter: `blur(${blur}px)`,
        opacity,
        top: position.top,
        right: position.right,
        bottom: position.bottom,
        left: position.left,
        transform,
      }}
    />
  );
}
