/**
 * Placeholder Redprint cluster mark. Drop the real SVG to /public/logos/redprint.svg
 * and swap this out for an <Image> or inline <svg>.
 */
export function RedprintMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="currentColor"
      aria-label="Redprint"
    >
      {/* Center */}
      <circle cx="16" cy="16" r="3" />
      {/* Six surrounding */}
      <circle cx="16" cy="6" r="2.6" />
      <circle cx="24.66" cy="11" r="2.6" />
      <circle cx="24.66" cy="21" r="2.6" />
      <circle cx="16" cy="26" r="2.6" />
      <circle cx="7.34" cy="21" r="2.6" />
      <circle cx="7.34" cy="11" r="2.6" />
    </svg>
  );
}
