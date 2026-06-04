"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Role = "member" | "owner";

export function RequestGymModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [gym, setGym] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  // Honeypot — hidden from real users via CSS, but cheap bots fill it.
  // The server treats any non-empty value as "drop silently."
  const [honey, setHoney] = useState("");
  // Member is the default — most submitters will be nudging their own
  // gym to adopt Redprint rather than gym owners reaching out directly.
  const [role, setRole] = useState<Role>("member");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Esc to close, body scroll lock while open.
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

  // All three inputs are required — submit button stays disabled until
  // every field has a non-whitespace value. Browser-level `required`
  // still fires native validation on empty submit attempts as a
  // backstop, but the visual gray state communicates the gate earlier.
  const isComplete =
    gym.trim() !== "" && location.trim() !== "" && email.trim() !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/request-gym", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gym, location, email, role, honey }),
      });
      if (!res.ok) {
        let code = "send_failed";
        try {
          const j = await res.json();
          if (j && typeof j.error === "string") code = j.error;
        } catch {
          // ignore — fall back to generic
        }
        // Friendly messages for known error codes.
        const msg =
          code === "invalid_email"
            ? "That email doesn't look right — try again?"
            : code === "missing_fields"
              ? "Please fill in all three fields."
              : code === "server_misconfigured"
                ? "We're not quite set up to send yet. Please email founders@redprint.fit directly."
                : "Something went wrong on our end. Please try again in a moment.";
        setSubmitError(msg);
        return;
      }
      setSubmitted(true);
    } catch (err) {
      console.error("[request-gym-modal] submit failed", err);
      setSubmitError(
        "Couldn't reach the server. Check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset after the fade-out so the modal animates closed cleanly
    // before content snaps back to defaults.
    setTimeout(() => {
      setSubmitted(false);
      setSubmitting(false);
      setSubmitError(null);
      setGym("");
      setLocation("");
      setEmail("");
      setHoney("");
      setRole("member");
    }, 250);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          aria-modal="true"
          role="dialog"
          aria-labelledby="request-gym-modal-title"
        >
          {/* Backdrop — click to dismiss. */}
          <button
            type="button"
            aria-label="Close"
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          {/* Card */}
          <motion.div
            className="relative w-[min(560px,92vw)] rounded-3xl bg-[#161616] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.55)] light:bg-[#ffffff] light:shadow-[0_24px_60px_rgba(0,0,0,0.12)]"
            initial={{ scale: 0.96, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 12 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Close X — top right */}
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-[#ffffff]/70 transition hover:bg-[#ffffff]/10 hover:text-[#ffffff] light:text-[#0a0a0a]/60 light:hover:bg-[#0a0a0a]/10 light:hover:text-[#0a0a0a]"
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
              <ThankYou onClose={handleClose} />
            ) : (
              <>
                <header className="pr-8">
                  <h2
                    id="request-gym-modal-title"
                    className="text-[#ffffff] text-[1.5rem] font-black leading-tight light:text-[#0a0a0a]"
                  >
                    Bring Redprint to your gym
                  </h2>
                  <p className="font-body text-[#ffffff]/70 mt-2 text-sm light:text-[#0a0a0a]/70">
                    Tell us where to find your gym. We&apos;ll reach out within
                    48 hours — no demo decks, just a chat.
                  </p>
                </header>

                <form onSubmit={handleSubmit} className="mt-5 flex flex-col">
                  {/* Honeypot — visually hidden, not autocomplete-eligible.
                      Real users skip it; bots fill it. The server treats
                      any non-empty value as a silent drop. */}
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
                  <RoleToggle value={role} onChange={setRole} />

                  <div className="mt-4 flex flex-col rounded-2xl bg-[#ffffff]/[0.04] p-2 light:bg-[#0a0a0a]/[0.04]">
                    <ModalInput
                      value={gym}
                      onChange={setGym}
                      placeholder="Gym name"
                      aria-label="Gym name"
                      required
                    />
                    <Divider />
                    <ModalInput
                      value={location}
                      onChange={setLocation}
                      placeholder="Location (city, state)"
                      aria-label="Location"
                      required
                    />
                    <Divider />
                    <ModalInput
                      value={email}
                      onChange={setEmail}
                      placeholder="Your email"
                      aria-label="Email"
                      type="email"
                      autoComplete="email"
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
                    {submitting ? "Sending…" : "Request your gym"}
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

                  <p className="font-body text-[#ffffff]/55 mt-3 text-center text-[11px] light:text-[#0a0a0a]/55">
                    Your info goes straight to the founding team. No spam, no
                    resale.
                  </p>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function RoleToggle({
  value,
  onChange,
}: {
  value: Role;
  onChange: (v: Role) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Are you a member or a gym owner?"
      className="flex rounded-full bg-[#ffffff]/[0.04] p-1 light:bg-[#0a0a0a]/[0.04]"
    >
      <ToggleOption
        active={value === "member"}
        onClick={() => onChange("member")}
        label="I'm a member"
      />
      <ToggleOption
        active={value === "owner"}
        onClick={() => onChange("owner")}
        label="I'm a gym owner"
      />
    </div>
  );
}

function ToggleOption({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={
        active
          ? "font-body flex-1 rounded-full bg-[#ffffff] px-4 py-2 text-sm font-semibold text-[#0a0a0a] transition light:bg-[#0a0a0a] light:text-[#ffffff]"
          : "font-body flex-1 rounded-full px-4 py-2 text-sm font-medium text-[#ffffff]/70 transition hover:text-[#ffffff] light:text-[#0a0a0a]/60 light:hover:text-[#0a0a0a]"
      }
    >
      {label}
    </button>
  );
}

function ModalInput({
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

function Divider() {
  // Black dashes in light mode, white dashes in dark mode. Two stacked
  // strips with the inverse theme variant kills the off-theme one so
  // only the correct stripe renders at any time.
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

function ThankYou({ onClose }: { onClose: () => void }) {
  return (
    <div className="py-4 pr-8">
      <h2 className="font-body text-[#ffffff] text-[1.5rem] font-bold leading-tight light:text-[#0a0a0a]">
        Thanks — we&apos;ll be in touch.
      </h2>
      <p className="font-body text-[#ffffff]/70 mt-3 text-sm light:text-[#0a0a0a]/70">
        Expect an email from the founding team within 48 hours. In the
        meantime, keep scrolling — there&apos;s more of Redprint below.
      </p>
      <button
        type="button"
        onClick={onClose}
        className="font-body mt-5 rounded-full bg-[#ffffff] px-5 py-3 text-sm font-semibold text-[#0a0a0a] transition-opacity hover:opacity-90 light:bg-[#0a0a0a] light:text-[#ffffff]"
      >
        Close
      </button>
    </div>
  );
}
