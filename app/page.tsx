import { Hero } from "@/components/sections/Hero";

export default function HomePage() {
  return (
    <>
      <Hero />
      {/* Spacer so there's something to scroll past after the pinned hero. */}
      <section className="text-fg-muted flex h-screen items-center justify-center">
        <p>Next section placeholder</p>
      </section>
    </>
  );
}
