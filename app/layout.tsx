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
  icons: {
    icon: [
      {
        url: "/favicon-light.svg",
        media: "(prefers-color-scheme: light)",
        type: "image/svg+xml",
      },
      {
        url: "/favicon-dark.svg",
        media: "(prefers-color-scheme: dark)",
        type: "image/svg+xml",
      },
    ],
  },
};

// Runs before any markup paints — always sets a data-theme attribute on
// <html>. Precedence: explicit localStorage choice (set by ThemeToggle)
// wins; otherwise follow the user's OS prefers-color-scheme; final
// fallback is dark if both lookups throw (private mode / old browsers).
const noFlashScript = `(function(){var t;try{var s=localStorage.getItem('theme');if(s==='light'||s==='dark')t=s;}catch(e){}if(!t){try{t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}catch(e){t='dark';}}document.documentElement.setAttribute('data-theme',t);})();`;

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
