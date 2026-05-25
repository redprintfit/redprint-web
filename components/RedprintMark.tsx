/**
 * Redprint emblem. Rendered as a CSS mask over a `currentColor` fill so
 * the logo automatically inherits the surrounding text color (white in
 * dark mode, dark in light mode).
 */
export function RedprintMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label="Redprint"
      className={className}
      style={{
        backgroundColor: "currentColor",
        WebkitMaskImage: "url(/logos/redprint-emblem.png)",
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskImage: "url(/logos/redprint-emblem.png)",
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
      }}
    />
  );
}
