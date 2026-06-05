"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Contact modal — opens from the Hero "Contact us" CTA. Same visual
 * language as RequestGymModal (black/white, rounded card, headline in
 * Outfit / body in Inter). Posts to /api/contact, which emails the
 * founder. Also surfaces a Calendly link as an alternative path for
 * users who'd rather book a call than write a message.
 */
export function ContactModal({
  open,
  onClose,
  calendlyUrl = "https://calendly.com/mikeheitz/30min",
}: {
  open: boolean;
  onClose: () => void;
  calendlyUrl?: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [honey, setHoney] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Esc + body scroll lock.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const isComplete =
    name.trim() !== "" && email.trim() !== "" && message.trim() !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, honey }),
      });
      if (!res.ok) {
        let code = "send_failed";
        try {
          const j = await res.json();
          if (j && typeof j.error === "string") code = j.error;
        } catch {
          // ignore
        }
        const msg =
          code === "invalid_email"
            ? "That email doesn't look right — try again?"
            : code === "missing_fields"
              ? "Please fill in all three fields."
              : code === "server_misconfigured"
                ? "We're not quite set up to send yet. Please email mheitz@redprintfit.com directly."
                : "Something went wrong on our end. Please try again in a moment.";
        setSubmitError(msg);
        return;
      }
      setSubmitted(true);
    } catch (err) {
      console.error("[contact-modal] submit failed", err);
      setSubmitError(
        "Couldn't reach the server. Check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setSubmitted(false);
      setSubmitting(false);
      setSubmitError(null);
      setName("");
      setEmail("");
      setMessage("");
      setHoney("");
    }, 250);
  };

  // Portal to <body> — see RequestGymModal for rationale (ancestor
  // transforms inside ScrollSequence break position:fixed otherwise).
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          data-lenis-prevent
          className="pointer-events-auto fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          aria-modal="true"
          role="dialog"
          aria-labelledby="contact-modal-title"
        >
          <div
            aria-hidden
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            onClick={(e) => e.stopPropagation()}
            className="relative w-[min(560px,92vw)] rounded-3xl bg-[#161616] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.55)] light:bg-[#ffffff] light:shadow-[0_24px_60px_rgba(0,0,0,0.12)]"
            initial={{ scale: 0.96, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 12 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              aria-label="Close"
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full text-[#ffffff]/70 transition hover:bg-[#ffffff]/10 hover:text-[#ffffff] light:text-[#0a0a0a]/60 light:hover:bg-[#0a0a0a]/10 light:hover:text-[#0a0a0a]"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {submitted ? (
              <ThankYou onClose={handleClose} calendlyUrl={calendlyUrl} />
            ) : (
              <>
                <header className="pr-8">
                  <h2
                    id="contact-modal-title"
                    className="text-[#ffffff] text-[1.5rem] font-black leading-tight light:text-[#0a0a0a]"
                  >
                    Contact us
                  </h2>
                  <p className="font-body text-[#ffffff]/70 mt-2 text-sm light:text-[#0a0a0a]/70">
                    Have a question, partnership idea, or just want to say hi?
                    Drop us a note. We&apos;ll get back to you within 48 hours.
                  </p>
                </header>

                <form onSubmit={handleSubmit} className="mt-5 flex flex-col">
                  <input
                    type="text"
                    name="company"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honey}
                    onChange={(e) => setHoney(e.target.value)}
                    aria-hidden
                    style={{
                      position: "absolute",
                      width: 1,
                      height: 1,
                      padding: 0,
                      margin: -1,
                      overflow: "hidden",
                      clip: "rect(0,0,0,0)",
                      whiteSpace: "nowrap",
                      border: 0,
                    }}
                  />
                  <div className="flex flex-col rounded-2xl bg-[#ffffff]/[0.04] p-2 light:bg-[#0a0a0a]/[0.04]">
                    <ContactInput
                      value={name}
                      onChange={setName}
                      placeholder="Your name"
                      aria-label="Name"
                      autoComplete="name"
                      required
                    />
                    <Divider />
                    <ContactInput
                      value={email}
                      onChange={setEmail}
                      placeholder="Your email"
                      aria-label="Email"
                      type="email"
                      autoComplete="email"
                      required
                    />
                    <Divider />
                    <ContactTextarea
                      value={message}
                      onChange={setMessage}
                      placeholder="Your message"
                      aria-label="Message"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!isComplete || submitting}
                    aria-disabled={!isComplete || submitting}
                    aria-busy={submitting}
                    className={
                      isComplete && !submitting
                        ? "mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#ffffff] px-5 py-3 text-sm font-semibold text-[#0a0a0a] transition-opacity hover:opacity-90 light:bg-[#0a0a0a] light:text-[#ffffff]"
                        : "mt-4 flex cursor-not-allowed items-center justify-center gap-2 rounded-full bg-[#ffffff]/30 px-5 py-3 text-sm font-semibold text-[#0a0a0a]/50 light:bg-[#0a0a0a]/15 light:text-[#0a0a0a]/45"
                    }
                  >
                    {submitting ? "Sending…" : "Send message"}
                    {!submitting && (
                      <svg
                        aria-hidden
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    )}
                  </button>

                  {submitError && (
                    <p
                      role="alert"
                      className="font-body mt-3 text-center text-[12px] text-[#ef4444]"
                    >
                      {submitError}
                    </p>
                  )}

                  {/* Secondary path: skip the form and book a call directly. */}
                  <div
                    aria-hidden
                    className="mt-5 flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-[#ffffff]/45 light:text-[#0a0a0a]/45"
                  >
                    <div className="h-px flex-1 bg-[#ffffff]/15 light:bg-[#0a0a0a]/15" />
                    <span>or</span>
                    <div className="h-px flex-1 bg-[#ffffff]/15 light:bg-[#0a0a0a]/15" />
                  </div>
                  <a
                    href={calendlyUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="font-body mt-4 inline-flex items-center justify-center gap-2 rounded-full border border-[#ffffff]/25 px-5 py-3 text-sm font-semibold text-[#ffffff] transition hover:bg-[#ffffff]/[0.06] light:border-[#0a0a0a]/25 light:text-[#0a0a0a] light:hover:bg-[#0a0a0a]/[0.04]"
                  >
                    <svg
                      aria-hidden
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                    </svg>
                    Schedule a 30-min call
                  </a>

                  <p className="font-body text-[#ffffff]/55 mt-3 text-center text-[11px] light:text-[#0a0a0a]/55">
                    Your note goes straight to the founding team. No spam, no
                    resale.
                  </p>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function ContactInput({
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
  required,
  ...rest
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  "aria-label": string;
}) {
  return (
    <div className="relative">
      <input
        {...rest}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="font-body w-full min-w-0 bg-transparent py-3 pl-4 pr-8 text-base text-[#ffffff] placeholder:text-[#ffffff]/50 focus:outline-none light:text-[#0a0a0a] light:placeholder:text-[#0a0a0a]/45"
      />
      {required && (
        <span
          aria-hidden
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 select-none text-base font-semibold leading-none text-[#ef4444]"
        >
          *
        </span>
      )}
    </div>
  );
}

function ContactTextarea({
  value,
  onChange,
  placeholder,
  required,
  ...rest
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  required?: boolean;
  "aria-label": string;
}) {
  return (
    <div className="relative">
      <textarea
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        rows={4}
        className="font-body w-full min-w-0 resize-none bg-transparent py-3 pl-4 pr-8 text-base text-[#ffffff] placeholder:text-[#ffffff]/50 focus:outline-none light:text-[#0a0a0a] light:placeholder:text-[#0a0a0a]/45"
      />
      {required && (
        <span
          aria-hidden
          className="pointer-events-none absolute right-4 top-4 select-none text-base font-semibold leading-none text-[#ef4444]"
        >
          *
        </span>
      )}
    </div>
  );
}

function Divider() {
  return (
    <div aria-hidden className="relative mx-4 h-px">
      <div
        className="absolute inset-0 light:hidden"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to right, rgba(255,255,255,0.20) 0 6px, transparent 6px 10px)",
        }}
      />
      <div
        className="absolute inset-0 hidden light:block"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to right, rgba(10,10,10,0.20) 0 6px, transparent 6px 10px)",
        }}
      />
    </div>
  );
}

function ThankYou({
  onClose,
  calendlyUrl,
}: {
  onClose: () => void;
  calendlyUrl: string;
}) {
  return (
    <div className="py-4 pr-8">
      <h2 className="font-body text-[#ffffff] text-[1.5rem] font-bold leading-tight light:text-[#0a0a0a]">
        Thanks — message received.
      </h2>
      <p className="font-body text-[#ffffff]/70 mt-3 text-sm light:text-[#0a0a0a]/70">
        We&apos;ll get back to you within 48 hours. If you&apos;d rather talk
        live, you can also book a quick call.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <a
          href={calendlyUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="font-body inline-flex items-center justify-center gap-2 rounded-full bg-[#ffffff] px-5 py-3 text-sm font-semibold text-[#0a0a0a] transition-opacity hover:opacity-90 light:bg-[#0a0a0a] light:text-[#ffffff]"
        >
          Schedule a call
        </a>
        <button
          type="button"
          onClick={onClose}
          className="font-body inline-flex items-center justify-center gap-2 rounded-full border border-[#ffffff]/25 px-5 py-3 text-sm font-semibold text-[#ffffff] transition hover:bg-[#ffffff]/[0.06] light:border-[#0a0a0a]/25 light:text-[#0a0a0a] light:hover:bg-[#0a0a0a]/[0.04]"
        >
          Close
        </button>
      </div>
    </div>
  );
}
