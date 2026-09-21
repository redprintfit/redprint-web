"use client";

import { useState } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";

export function RequestGymForm({
  formTextP,
}: {
  formTextP: MotionValue<number>;
}) {
  const [gym, setGym] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  // Honeypot — hidden from real users via CSS, but cheap bots fill it.
  // The server treats any non-empty value as "drop silently."
  const [honey, setHoney] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Fade + lift the form into place over the tail end of the
  // sentence-formation. Tied to scroll so it reverses naturally
  // when the user scrolls back up.
  const opacity = useTransform(formTextP, [0.85, 1], [0, 1]);
  const y = useTransform(formTextP, [0.85, 1], [14, 0]);

  // All three fields are required — the button stays in its disabled
  // state until each has a non-whitespace value. Mirrors the gate in
  // RequestGymModal so both entry points behave identically.
  const isComplete =
    gym.trim() !== "" && location.trim() !== "" && email.trim() !== "";

  // Same submission contract as RequestGymModal. This form has no
  // member/owner toggle, so it posts role "member" — the modal's
  // default, and the right assumption for a form that sits at the end
  // of the consumer scroll story.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/request-gym", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gym, location, email, role: "member", honey }),
      });
      if (!res.ok) {
        let code = "send_failed";
        try {
          const j = await res.json();
          if (j && typeof j.error === "string") code = j.error;
        } catch {
          // ignore — fall back to generic
        }
        setSubmitError(
          code === "invalid_email"
            ? "That email doesn't look right. Try again?"
            : code === "missing_fields"
              ? "Please fill in all three fields."
              : code === "server_misconfigured"
                ? "We're not quite set up to send yet. Please email founders@redprint.fit directly."
                : "Something went wrong on our end. Please try again in a moment.",
        );
        return;
      }
      setSubmitted(true);
      setGym("");
      setLocation("");
      setEmail("");
      setHoney("");
    } catch (err) {
      console.error("[request-gym-form] submit failed", err);
      setSubmitError(
        "Couldn't reach the server. Check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      className="pointer-events-auto absolute left-1/2 top-[44vh] z-[53] w-[min(560px,86vw)] -translate-x-1/2"
      style={{ opacity, y }}
    >
      {submitted ? (
        <ThankYou />
      ) : (
        <form
          onSubmit={handleSubmit}
          className="relative flex flex-col rounded-3xl bg-[#2a0909] p-2 shadow-[0_8px_28px_rgba(0,0,0,0.18)] light:bg-[#fbe0e0] light:shadow-[0_8px_28px_rgba(127,29,29,0.12)]"
        >
          {/* Honeypot — visually hidden, not autocomplete-eligible. */}
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
          <FormInput
            value={gym}
            onChange={setGym}
            placeholder="Gym name"
            aria-label="Gym name"
            required
          />
          <Divider />
          <FormInput
            value={location}
            onChange={setLocation}
            placeholder="Location (city, state)"
            aria-label="Location"
            required
          />
          <Divider />
          <FormInput
            value={email}
            onChange={setEmail}
            placeholder="Your email"
            aria-label="Email"
            type="email"
            autoComplete="email"
            required
          />
          <button
            type="submit"
            disabled={!isComplete || submitting}
            aria-disabled={!isComplete || submitting}
            aria-busy={submitting}
            className={
              isComplete && !submitting
                ? "mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#fecaca] px-5 py-3 text-sm font-semibold text-[#1f0505] transition-opacity hover:opacity-90 light:bg-[#1f0505] light:text-[#fecaca]"
                : "mt-2 flex cursor-not-allowed items-center justify-center gap-2 rounded-full bg-[#fecaca]/30 px-5 py-3 text-sm font-semibold text-[#1f0505]/50 light:bg-[#1f0505]/25 light:text-[#fecaca]/70"
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
              className="font-body mb-1 mt-3 px-5 text-center text-[12px] text-[#ef4444]"
            >
              {submitError}
            </p>
          )}
        </form>
      )}
    </motion.div>
  );
}

function ThankYou() {
  return (
    <div className="relative rounded-3xl bg-[#2a0909] px-6 py-7 text-center shadow-[0_8px_28px_rgba(0,0,0,0.18)] light:bg-[#fbe0e0] light:shadow-[0_8px_28px_rgba(127,29,29,0.12)]">
      <h3 className="font-body text-[1.35rem] font-bold leading-tight text-[#fecaca] light:text-[#1f0505]">
        Thanks. We&apos;ll be in touch.
      </h3>
      <p className="font-body mt-2 text-sm text-[#fecaca]/70 light:text-[#1f0505]/70">
        Expect an email from the founding team within 48 hours.
      </p>
    </div>
  );
}

function FormInput({
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
        className="w-full min-w-0 bg-transparent py-3 pl-5 pr-8 text-base text-[#fecaca] placeholder:text-[#fecaca]/50 focus:outline-none light:text-[#1f0505] light:placeholder:text-[#1f0505]/45"
      />
      {required && (
        <span
          aria-hidden
          className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 select-none text-base font-semibold leading-none text-[#ef4444]"
        >
          *
        </span>
      )}
    </div>
  );
}

function Divider() {
  return (
    <div
      aria-hidden
      className="mx-5 h-px"
      style={{
        backgroundImage:
          "repeating-linear-gradient(to right, rgba(254,202,202,0.22) 0 6px, transparent 6px 10px)",
      }}
    />
  );
}
