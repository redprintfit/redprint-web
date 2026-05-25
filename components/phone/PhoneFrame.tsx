import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Status bar tint (text/icons). Defaults to light. */
  variant?: "light" | "dark";
};

/**
 * iPhone-shaped device shell. Children render inside the screen area.
 * Width is fluid via the className; aspect ratio is fixed to a modern iPhone.
 */
export function PhoneFrame({ children, className, variant = "light" }: Props) {
  return (
    <div
      className={cn(
        "relative aspect-[9/19.5] w-[260px] shrink-0 rounded-[44px] bg-neutral-950 p-[6px] shadow-[0_25px_60px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/5",
        className,
      )}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[38px] bg-neutral-900">
        {/* Status bar */}
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 pt-2 text-[11px] font-medium",
            variant === "light" ? "text-white" : "text-black",
          )}
        >
          <span>3:48</span>
          <span className="flex items-center gap-1">
            <span>•••</span>
          </span>
        </div>

        {/* Dynamic island */}
        <div className="pointer-events-none absolute left-1/2 top-2 z-20 h-[22px] w-[80px] -translate-x-1/2 rounded-full bg-black" />

        {/* Screen content */}
        <div className="relative h-full w-full pt-7">{children}</div>
      </div>
    </div>
  );
}
