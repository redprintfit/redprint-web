import { notFound } from "next/navigation";

/**
 * Dev-only gallery showing the three /api/request-gym transactional
 * email templates side-by-side, each in its own iframe so the email
 * HTML's <html><body> wrappers render correctly.
 *
 * 404s in production — same gate as the /api/_email-preview route.
 */
export default function EmailPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  const items = [
    {
      key: "founder",
      label: "Founder notification",
      sub: "Sent to REQUEST_GYM_FOUNDER_EMAIL. Reply-To = submitter.",
    },
    {
      key: "member",
      label: "Member auto-reply",
      sub: "Sent to submitter when role = member.",
    },
    {
      key: "owner",
      label: "Owner auto-reply",
      sub: "Sent to submitter when role = owner.",
    },
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0e0e10",
        color: "#f5f1ee",
        padding: 32,
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <header style={{ maxWidth: 1400, margin: "0 auto 20px" }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
          Email previews
        </h1>
        <p style={{ margin: "6px 0 0", opacity: 0.65, fontSize: 14 }}>
          Renders the same HTML the API would send. Dev-only route.
        </p>
      </header>
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
          gap: 24,
        }}
      >
        {items.map((i) => (
          <section
            key={i.key}
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14,
              overflow: "hidden",
              background: "#16161a",
            }}
          >
            <div style={{ padding: "14px 18px" }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{i.label}</div>
              <div style={{ opacity: 0.6, fontSize: 12, marginTop: 2 }}>
                {i.sub}
              </div>
            </div>
            <iframe
              src={`/api/email-preview?t=${i.key}`}
              title={i.label}
              style={{
                width: "100%",
                height: 720,
                border: 0,
                background: "#f5f1ee",
              }}
            />
          </section>
        ))}
      </div>
    </main>
  );
}
