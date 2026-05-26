"use client";

import { useState } from "react";
import { BlobAvatar } from "@/components/BlobAvatar";

/**
 * Local-state wrapper that pairs the BlobAvatar with a mode toggle.
 * Keeps the page itself a server component.
 */
export function BlobAvatarDemo() {
  const [mode, setMode] = useState<"idle" | "loading">("idle");

  return (
    <div className="flex flex-col items-center gap-6">
      <BlobAvatar mode={mode} size={320} />

      <button
        type="button"
        onClick={() => setMode((m) => (m === "idle" ? "loading" : "idle"))}
        className="border-fg-base/30 text-fg-base hover:bg-fg-base/10 rounded-full border px-5 py-2 text-sm font-semibold transition"
      >
        {mode === "idle" ? "Loading" : "Idle"}
      </button>
    </div>
  );
}
