"use client";

import { useTheme } from "@/lib/useTheme";

/**
 * Card matching the Pillars section's box surface — rounded outline
 * with a soft tinted fill (theme-aware via the same fillRgb formula
 * Pillars uses), an eyebrow header row (left/right) with a dashed
 * divider below, then headline + description.
 *
 * Used by `TrackingCards` for the three "01 SPEED / 02 MEMORY / 03
 * DEPTH" cards on the right side of the tracking section.
 */
type Props = {
  index: string;
  label: string;
  title: string;
  description: string;
};

export function InfoCard({ index, label, title, description }: Props) {
  const isDark = useTheme() === "dark";
  // Same formula as Pillars.tsx — fg colour drives a low-alpha border
  // and an even lower-alpha tint behind the content. Stays readable on
  // both the dark and light themes.
  const fillRgb = isDark ? "245, 241, 238" : "26, 14, 13";

  return (
    <div
      className="overflow-hidden"
      style={{
        borderRadius: 28,
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: `rgba(${fillRgb}, 0.3)`,
        backgroundColor: `rgba(${fillRgb}, 0.05)`,
      }}
    >
      {/* Header row — eyebrow text left + label right, with dashed
          divider under. Same treatment as Pillars' VisualHeader. */}
      <div className="border-fg-base/12 font-body flex items-center justify-between border-b border-dashed px-5 pb-2 pt-4 text-[10px]">
        <div className="text-fg-muted tracking-[0.12em]">{index}</div>
        <div className="text-fg-base/80 tracking-[0.14em]">{label}</div>
      </div>
      <div className="px-5 pb-5 pt-3">
        <h3 className="text-fg-base text-[22px] font-medium leading-[1.15] tracking-tight">
          {title}
        </h3>
        <p className="text-fg-muted font-body mt-2 text-[13.5px] leading-[1.5]">
          {description}
        </p>
      </div>
    </div>
  );
}
