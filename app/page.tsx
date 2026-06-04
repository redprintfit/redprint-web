import { ScrollSequence } from "@/components/sections/ScrollSequence";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { HashScrollTarget } from "@/components/HashScrollTarget";

export default function HomePage() {
  return (
    <>
      <HashScrollTarget />
      <ScrollSequence />
      <SiteFooter />
    </>
  );
}
