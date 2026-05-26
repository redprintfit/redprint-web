import { type Org } from "@/lib/content/orgs";

/**
 * Exercise detail (Glute Drive) — video hero + bottom sheet with actions
 * and a horizontal video carousel.
 */
export function ExerciseRedprintView(_props: { org: Org }) {
  return (
    <div className="light:bg-white flex h-full flex-col bg-black">
      {/* Video / image hero (placeholder gradient stands in for the gym video) */}
      <div
        className="relative flex-1"
        style={{
          background:
            "linear-gradient(180deg, #6b6f78 0%, #4a4d54 50%, #25262a 100%)",
        }}
      >
        {/* Implied equipment silhouette via dark blobs */}
        <div className="absolute inset-x-0 top-12 mx-auto h-24 w-32 rounded-full bg-black/30 blur-2xl" />
        <div className="absolute bottom-0 left-0 h-20 w-16 rounded-full bg-black/40 blur-xl" />
        <div className="absolute bottom-0 right-0 h-20 w-16 rounded-full bg-black/40 blur-xl" />

        <div className="absolute inset-x-0 bottom-4 text-center text-[8px] text-white/50">
          ⌃<br />
          Tap above to play video
        </div>
      </div>

      {/* Bottom sheet */}
      <div className="light:bg-[#fdf6f0] rounded-t-2xl bg-[#1c0d0e] px-2.5 pb-3 pt-1.5">
        {/* Drag indicator */}
        <div className="light:bg-black/25 mx-auto h-[3px] w-7 rounded-full bg-white/30" />

        {/* Title row */}
        <div className="mt-2 flex items-center gap-1.5">
          <div className="light:text-black/70 text-[10px] text-white/70">‹</div>
          <div className="light:bg-black/10 flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
            <div className="h-5 w-5 rounded-full bg-[#7B4F2C]" />
          </div>
          <div className="light:text-black flex-1 text-[11px] font-bold text-white">
            Glute Drive
          </div>
          <div className="light:bg-black/10 light:text-black/70 flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[8px] text-white/70">
            ✕
          </div>
        </div>

        {/* Action row */}
        <div className="mt-2 flex items-center gap-1">
          <div className="light:bg-black/8 light:text-black flex h-7 w-7 items-center justify-center rounded-md bg-white/8 text-[9px]">
            ♡
          </div>
          <div className="flex h-7 flex-1 items-center justify-between rounded-md bg-[#b91c2e] px-2 text-[8px] font-bold leading-tight text-white">
            <span>
              Generate
              <br />
              Workout
            </span>
            <span className="h-3 w-3 rounded-full bg-white/30" />
          </div>
          <div className="flex h-7 flex-1 items-center justify-between rounded-md bg-[#22c55e] px-2 text-[8px] font-bold leading-tight text-white">
            <span>
              Add Exercise
              <br />
              to Workout
            </span>
            <span className="text-[10px]">+</span>
          </div>
        </div>

        {/* Video carousel */}
        <div className="mt-2 flex gap-1 overflow-hidden">
          <VideoThumb />
          <VideoThumb active label="Now playing" sub="@gymitfitne…" />
          <VideoThumb />
          <VideoThumb />
        </div>

        <div className="light:text-black/40 mt-1.5 text-center text-[7px] text-white/40">
          Swipe up for more info ⌃
        </div>
      </div>
    </div>
  );
}

function VideoThumb({
  active,
  label,
  sub,
}: {
  active?: boolean;
  label?: string;
  sub?: string;
}) {
  return (
    <div
      className={`relative aspect-[2/3] flex-1 overflow-hidden rounded-md ${active ? "ring-2 ring-sky-400" : ""}`}
      style={{
        background:
          "linear-gradient(180deg, #4a3a30 0%, #2a1a14 60%, #18100c 100%)",
      }}
    >
      {active && label && (
        <div className="absolute inset-x-0 top-0.5 text-center text-[6px] font-bold text-orange-400">
          {label}
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0.5 px-1 text-[7px] font-medium text-white">
        How to
        {sub && <div className="text-[5.5px] text-white/60">{sub}</div>}
      </div>
    </div>
  );
}
