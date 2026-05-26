import { Hero } from "@/components/sections/Hero";
import { BlobAvatarDemo } from "@/components/BlobAvatarDemo";

export default function HomePage() {
  return (
    <>
      <Hero />
      <section className="flex h-screen items-center justify-center">
        <BlobAvatarDemo />
      </section>
    </>
  );
}
