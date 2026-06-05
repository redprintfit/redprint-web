import { SiteFooter } from "@/components/layout/SiteFooter";

/**
 * Shared layout for legal pages (Privacy Policy, Terms of Service).
 * Centered narrow column with a heading + "Last updated" subtitle,
 * a prose region for the body, and SiteFooter at the bottom so the
 * page is visually anchored like the rest of the site.
 *
 * Children are styled via descendant arbitrary variants so plain
 * <h2>/<h3>/<p>/<ul>/<strong>/<a> tags can be written inline in
 * the page file without per-tag class plumbing.
 */
export function LegalPage({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <section className="mx-auto max-w-3xl px-6 pb-24 pt-32 sm:px-8 sm:pt-40">
        <header className="mb-12">
          <h1 className="text-fg-base text-4xl font-black tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="font-body text-fg-base/55 mt-3 text-sm">
            Last updated: {lastUpdated}
          </p>
        </header>
        <div
          className={[
            "font-body text-fg-base/85 text-[15px] leading-relaxed",
            "[&_h2]:text-fg-base [&_h2]:mt-14 [&_h2]:mb-5 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:tracking-tight",
            "[&_h3]:text-fg-base [&_h3]:mt-9 [&_h3]:mb-3 [&_h3]:text-lg [&_h3]:font-bold",
            "[&_h4]:text-fg-base [&_h4]:mt-7 [&_h4]:mb-2 [&_h4]:text-[15px] [&_h4]:font-semibold",
            "[&_p]:mb-4",
            "[&_ul]:my-4 [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-2",
            "[&_strong]:text-fg-base [&_strong]:font-semibold",
            "[&_a]:text-fg-base [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:opacity-80",
          ].join(" ")}
        >
          {children}
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
