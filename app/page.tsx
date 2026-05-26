import { Hero } from "@/components/sections/Hero";
import { BlobAvatar } from "@/components/BlobAvatar";

export default function HomePage() {
  return (
    <>
      <Hero />
      <section className="flex h-screen items-center justify-center">
        <BlobAvatar mode="idle" size={320} />
      </section>
    </>
  );
}
