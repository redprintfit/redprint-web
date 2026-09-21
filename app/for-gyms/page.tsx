import type { Metadata } from "next";
import { GymHero } from "@/components/gyms/GymHero";
import { TagStudio } from "@/components/gyms/TagStudio";
import { GymFeatures } from "@/components/gyms/GymFeatures";
import { GymClosing } from "@/components/gyms/GymClosing";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const metadata: Metadata = {
  title: "Redprint for gyms | Branded NFC tags for your equipment",
  description:
    "Put a branded Redprint tag on every machine. Members tap to train; you get engagement, equipment usage, and a member experience that carries your gym's name.",
};

export default function ForGymsPage() {
  return (
    <div className="gym-page relative min-h-screen overflow-hidden">
      {/* Paper texture, matching the home page's treatment. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[var(--paper-opacity)]"
        style={{
          backgroundImage: "url(/textures/paper.jpg)",
          backgroundSize: "cover",
          backgroundRepeat: "repeat",
        }}
      />

      {/* Without JS the IntersectionObserver never runs, which would
          leave every `.reveal` block stuck at opacity 0. */}
      <noscript>
        <style>{`.reveal{opacity:1 !important;transform:none !important}[data-typed-tail]{visibility:visible !important}`}</style>
      </noscript>

      <div className="relative">
        <GymHero />
        <TagStudio />
        <GymFeatures />
        <GymClosing />
      </div>

      <SiteFooter />
    </div>
  );
}
