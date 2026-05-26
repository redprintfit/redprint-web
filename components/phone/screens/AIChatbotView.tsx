import { type Org } from "@/lib/content/orgs";

/**
 * AI chatbot screen — sample chest-day workout conversation.
 */
export function AIChatbotView(_props: { org: Org }) {
  return (
    <div className="light:bg-white light:text-black flex h-full flex-col bg-black text-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 pb-2 pt-7">
        <div className="flex gap-1.5">
          <IconBtn>≡</IconBtn>
          <IconBtn>💬+</IconBtn>
        </div>
        <IconBtn>✕</IconBtn>
      </div>

      {/* Chat */}
      <div className="flex flex-1 flex-col gap-2.5 overflow-hidden px-3 pb-2">
        <UserBubble>Build me a chest day workout</UserBubble>

        <BotMessage>
          <p className="text-[10px]">What&apos;s your available time today?</p>
          <div className="light:text-black/40 mt-1.5 flex gap-1.5 text-[9px] text-white/40">
            <span>↻</span>
            <span>⧉</span>
          </div>
        </BotMessage>

        <UserBubble>1.5 hours</UserBubble>

        <BotMessage>
          <p className="text-[9px] leading-tight">
            Here&apos;s your chest day workout — 90 minutes of voluntarily
            making your pecs very angry:
          </p>
          <p className="mt-1.5 text-[9px] font-bold">Chest Power Session</p>
          <ol className="mt-1 space-y-0.5 text-[8px] leading-tight">
            <li>
              <span className="font-semibold">1. Barbell Bench Press</span> —
              4x8 @ 135 lbs
            </li>
            <li>
              <span className="font-semibold">
                2. Barbell Incline Bench Press
              </span>{" "}
              — 4x8 @ 115 lbs
            </li>
            <li>
              <span className="font-semibold">
                3. Dumbbell Incline Bench Press
              </span>{" "}
              — 3x10 @ 50 lbs
            </li>
            <li>
              <span className="font-semibold">4. Dumbbell Fly</span> — 3x12 @ 30
              lbs
            </li>
            <li>
              <span className="font-semibold">5. Cable Crossover</span> — 3x15 @
              30 lbs
            </li>
            <li className="opacity-60">
              <span className="font-semibold">6. Cable Fly</span> — 3x15 @ 25
              lbs
            </li>
          </ol>
        </BotMessage>
      </div>

      {/* Input */}
      <div className="px-3 pb-3">
        <div className="flex items-center gap-1.5">
          <div className="light:border-black/15 light:bg-white light:text-black/40 flex-1 rounded-full border border-white/15 bg-black px-3 py-1.5 text-[9px] text-white/30">
            Ask Redprint…
          </div>
          <div className="light:bg-black/15 light:text-black/60 flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-[10px] text-white/60">
            ↑
          </div>
        </div>
      </div>
    </div>
  );
}

function IconBtn({ children }: { children: React.ReactNode }) {
  return (
    <div className="light:bg-black/10 light:text-black/80 flex h-6 w-6 items-center justify-center rounded-full bg-white/8 text-[9px] text-white/80">
      {children}
    </div>
  );
}

function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="light:bg-black/10 ml-auto max-w-[70%] rounded-2xl bg-white/8 px-2.5 py-1.5 text-[9px]">
      {children}
    </div>
  );
}

function BotMessage({ children }: { children: React.ReactNode }) {
  return <div className="max-w-[88%]">{children}</div>;
}
