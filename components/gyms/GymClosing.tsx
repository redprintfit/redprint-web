"use client";

import { RedprintTag } from "@/components/gyms/RedprintTag";
import { Eyebrow, GhostButton, TypedHeading, OrderTagsButton, Reveal } from "@/components/gyms/GymUI";
import { orgs } from "@/lib/content/orgs";

/**
 * Closing CTA. The tag has had its own section; this one is about what
 * the gym becomes. Three real partner tags stand in for "gyms like
 * yours" rather than being the subject.
 */
export function GymClosing() {
  const showcase = ["waverley_oaks", "pepperdine", "ymca_middlesex"]
    .map((id) => orgs.find((o) => o.id === id))
    .filter((o): o is NonNullable<typeof o> => Boolean(o));

  return (
    <section className="gym-defer relative px-6 py-24 sm:px-10 md:py-32">
      <div className="mx-auto flex max-w-[860px] flex-col items-center text-center">
        <Reveal className="flex flex-col items-center">
          <div className="flex items-end justify-center gap-3 sm:gap-6">
            {showcase.map((org, i) => (
              <RedprintTag
                key={org.id}
                // White silhouettes here, unlike the hero: a uniform
                // treatment reads as a set, and the logos chosen hold
                // their shape when flattened.
                design={{
                  primary: org.primaryColor,
                  logoUrl: org.logoSrc,
                  logoTreatment: "white",
                }}
                width={i === 1 ? 150 : 118}
                glow={i === 1}
              />
            ))}
          </div>

          <Eyebrow className="mt-12 justify-center">Get started</Eyebrow>
          <TypedHeading
            className="mt-4 text-center"
            lines={[{ text: "Bring your gym" }, { text: "into the future." }]}
          />
          <p
            className="font-body mt-5 max-w-[480px] text-[16px] leading-relaxed"
            style={{ color: "var(--gym-muted)" }}
          >
            The gyms members choose are the ones that feel modern. Give yours the
            technology to compete with any big-box chain, without the big-box budget.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <OrderTagsButton />
            <GhostButton href="https://calendly.com/mikeheitz/30min">
              Book a 20 minute call
            </GhostButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
