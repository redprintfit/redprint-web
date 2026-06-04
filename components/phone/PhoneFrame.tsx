import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  /**
   * Forces the status-bar text color regardless of theme.
   * Leave unset to let it follow the marketing site theme
   * (white in dark, black in light).
   */
  variant?: "light" | "dark";
  /** Background of the screen interior. Defaults to black->white per theme. */
  screenBg?: string;
  /**
   * Rendered width of the phone, in CSS pixels. Internally the phone is
   * always laid out at the canonical 260px design size — when `width`
   * differs, we scale the whole device (frame, screen, status bar, every
   * child) with a single `transform: scale()`, so all of the fixed-pixel
   * sizes inside the screens stay perfectly proportional. Defaults to 260.
   */
  width?: number;
  /**
   * Suppress the built-in box-shadow glow so the caller can render
   * (and independently animate) the glow themselves — used by ghost
   * phone copies that fade their halo in separately from the body.
   */
  shadowless?: boolean;
};

const DESIGN_WIDTH = 260;
const ASPECT_W = 9;
const ASPECT_H = 19.5;

/**
 * iPhone-shaped device shell. Children render inside the screen area
 * (full height — they're responsible for their own status-bar spacing).
 */
export function PhoneFrame({
  children,
  className,
  variant,
  screenBg = "bg-black light:bg-white",
  width = DESIGN_WIDTH,
  shadowless = false,
}: Props) {
  const scale = width / DESIGN_WIDTH;
  const designHeight = DESIGN_WIDTH * (ASPECT_H / ASPECT_W);

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{
        width,
        height: width * (ASPECT_H / ASPECT_W),
      }}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{
          width: DESIGN_WIDTH,
          height: designHeight,
          transform: `scale(${scale})`,
        }}
      >
        <div
          className={cn(
            "relative h-full w-full rounded-[44px] bg-neutral-950 p-[5px] ring-1 ring-white/10",
            !shadowless &&
              "shadow-[0_0_100px_-15px_rgba(255,255,255,0.14)] light:shadow-[0_25px_60px_-20px_rgba(0,0,0,0.6)]",
          )}
        >
          <div
            className={cn(
              "relative h-full w-full overflow-hidden rounded-[40px]",
              screenBg,
            )}
          >
            {/* Status bar — time + signal/wifi/battery */}
            <div
              className={cn(
                "pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between px-5 pt-[6px] text-[8.5px] font-semibold",
                variant === "light"
                  ? "text-white"
                  : variant === "dark"
                    ? "text-black"
                    : "text-white light:text-black",
              )}
            >
              <span className="tracking-tight">3:48</span>
              <span className="flex items-center gap-[3px]">
                <SignalBars />
                <WifiIcon />
                <BatteryIcon />
              </span>
            </div>

            {/* Dynamic island */}
            <div className="pointer-events-none absolute left-1/2 top-[5px] z-40 h-[18px] w-[68px] -translate-x-1/2 rounded-full bg-black" />

            {/* Screen content — fills full height, child handles top padding */}
            <div className="relative h-full w-full">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SignalBars() {
  return (
    <svg viewBox="0 0 16 10" className="h-[7px] w-[10px] fill-current">
      <rect x="0" y="6" width="2.5" height="4" rx="0.5" />
      <rect x="3.5" y="4" width="2.5" height="6" rx="0.5" />
      <rect x="7" y="2" width="2.5" height="8" rx="0.5" />
      <rect x="10.5" y="0" width="2.5" height="10" rx="0.5" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg viewBox="0 0 16 12" className="h-[7px] w-[9px] fill-current">
      <path d="M8 11.5a1 1 0 100-2 1 1 0 000 2zM3 6.5c1.5-1.3 3.2-2 5-2s3.5.7 5 2l-1.4 1.4c-1-.9-2.2-1.4-3.6-1.4s-2.6.5-3.6 1.4L3 6.5zm-2.5-2.5C2.7 1.8 5.3.5 8 .5s5.3 1.3 7.5 3.5L14 5.4C12.4 3.9 10.2 3 8 3S3.6 3.9 2 5.4L.5 4z" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg viewBox="0 0 22 10" className="h-[7px] w-[14px] fill-current">
      <rect
        x="0.5"
        y="0.5"
        width="18"
        height="9"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.7"
        opacity="0.5"
      />
      <rect x="20" y="3" width="1.5" height="4" rx="0.5" opacity="0.5" />
      <rect x="2" y="2" width="6" height="6" rx="1" />
    </svg>
  );
}
