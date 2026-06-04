import type { Metadata } from "next";
import { Outfit, Inter, Bitcount_Grid_Single } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/layout/Nav";
import { LenisProvider } from "@/components/animations/LenisProvider";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
});

// Neutral grotesque for body / supporting text. Outfit stays the display
// face (headlines, big numbers). Inter handles labels, descriptions,
// and any small UI text inside the pillars / mini-visuals.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

// Bitcount Grid Single — dot-matrix pixel font. Each letter is
// drawn as a dense grid of dots. Used by the testimonials section
// to convert the field of small hollow dots into a sentence:
// canvas → CCA (high alpha threshold) → one target per font-dot.
const bitcountGrid = Bitcount_Grid_Single({
  variable: "--font-bitcount-grid",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Redprint",
  description: "Fitness AI that knows your gym.",
};

// Runs before any markup paints — always sets a data-theme attribute on
// <html>. Reads localStorage; defaults to "dark" if absent. For production,
// switch the default to system preference (matchMedia prefers-color-scheme).
const noFlashScript = `(function(){var t='dark';try{var s=localStorage.getItem('theme');if(s==='light'||s==='dark')t=s;}catch(e){}document.documentElement.setAttribute('data-theme',t);})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} ${bitcountGrid.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body className="bg-bg-base text-fg-base flex min-h-full flex-col font-sans">
        <LenisProvider>
          <Nav />
          <main className="flex-1">{children}</main>
        </LenisProvider>
      </body>
    </html>
  );
}
