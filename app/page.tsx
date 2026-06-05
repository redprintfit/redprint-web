import { headers } from "next/headers";
import { HashScrollTarget } from "@/components/HashScrollTarget";
import { HomePageSwitcher } from "@/components/HomePageSwitcher";

// Cheap UA test — covers the phones and tablets we care about. A
// false negative (mobile UA we don't recognize) just produces the
// desktop tree at first paint and gets corrected by the client-side
// matchMedia listener in HomePageSwitcher. Tablets like iPad get the
// mobile tree, which matches the design intent (no scroll choreography).
const MOBILE_UA = /Mobi|Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i;

export default async function HomePage() {
  const ua = (await headers()).get("user-agent") ?? "";
  const initialView: "mobile" | "desktop" = MOBILE_UA.test(ua)
    ? "mobile"
    : "desktop";
  return (
    <>
      <HashScrollTarget />
      <HomePageSwitcher initialView={initialView} />
    </>
  );
}
