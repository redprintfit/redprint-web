import { Hero } from "@/components/sections/Hero";

export default function HomePage() {
  return (
    <>
      <Hero />
      {/* Spacer so there's something to scroll past after the pinned hero. */}
      <section className="flex h-screen items-center justify-center text-white/60">
        <p>Next section placeholder</p>
      </section>
    </>
  );
}
