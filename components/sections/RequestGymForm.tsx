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
  // Fade + lift the form into place over the tail end of the
  // sentence-formation. Tied to scroll so it reverses naturally
  // when the user scrolls back up.
  const opacity = useTransform(formTextP, [0.85, 1], [0, 1]);
  const y = useTransform(formTextP, [0.85, 1], [14, 0]);

  return (
    <motion.div
      className="pointer-events-auto absolute left-1/2 top-[44vh] z-[53] w-[min(560px,86vw)] -translate-x-1/2"
      style={{ opacity, y }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          // TODO: wire to real submission endpoint.
          setGym("");
          setLocation("");
          setEmail("");
        }}
        className="relative flex flex-col rounded-3xl bg-[#2a0909] p-2 shadow-[0_8px_28px_rgba(0,0,0,0.18)] light:bg-[#fbe0e0] light:shadow-[0_8px_28px_rgba(127,29,29,0.12)]"
      >
        <FormInput
          value={gym}
          onChange={setGym}
          placeholder="Gym name"
          aria-label="Gym name"
        />
        <Divider />
        <FormInput
          value={location}
          onChange={setLocation}
          placeholder="Location (city, state)"
          aria-label="Location"
        />
        <Divider />
        <FormInput
          value={email}
          onChange={setEmail}
          placeholder="Your email"
          aria-label="Email"
          type="email"
          autoComplete="email"
        />
        <button
          type="submit"
          className="mt-2 flex items-center justify-center gap-2 rounded-full bg-[#fecaca] px-5 py-3 text-sm font-semibold text-[#1f0505] transition-opacity hover:opacity-90 light:bg-[#1f0505] light:text-[#fecaca]"
        >
          Request your gym
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
        </button>
      </form>
    </motion.div>
  );
}

function FormInput({
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
  ...rest
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  autoComplete?: string;
  "aria-label": string;
}) {
  return (
    <input
      {...rest}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      className="min-w-0 bg-transparent px-5 py-3 text-base text-[#fecaca] placeholder:text-[#fecaca]/50 focus:outline-none light:text-[#1f0505] light:placeholder:text-[#1f0505]/45"
    />
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
