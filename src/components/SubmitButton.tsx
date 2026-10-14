"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { useFormStatus } from "react-dom";

// Shows a spinner while this button's form action runs, then a short checkmark.
export default function SubmitButton({
  children,
  className = "",
  onClick,
  ...props
}: ComponentProps<"button">) {
  const { pending } = useFormStatus();
  const [clicked, setClicked] = useState(false);
  const [done, setDone] = useState(false);
  const wasPending = useRef(false);

  const busy = pending && clicked;

  useEffect(() => {
    if (busy) {
      wasPending.current = true;
      return;
    }
    if (wasPending.current) {
      wasPending.current = false;
      const show = setTimeout(() => {
        setClicked(false);
        setDone(true);
      }, 0);
      const hide = setTimeout(() => setDone(false), 1500);
      return () => {
        clearTimeout(show);
        clearTimeout(hide);
      };
    }
    if (clicked && !pending) {
      // The click never started a submit, e.g. a required field was empty.
      const reset = setTimeout(() => setClicked(false), 1000);
      return () => clearTimeout(reset);
    }
  }, [busy, clicked, pending]);

  return (
    <button
      type="submit"
      {...props}
      aria-busy={busy || undefined}
      onClick={(e) => {
        if (busy) {
          e.preventDefault();
          return;
        }
        setDone(false);
        setClicked(true);
        onClick?.(e);
      }}
      className={`inline-flex items-center justify-center gap-2 ${className}`}
    >
      {busy && (
        <span
          className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      )}
      {children}
      {done && <span aria-hidden>✓</span>}
      <span className="sr-only" role="status">
        {busy ? "Bezig..." : done ? "Gelukt" : ""}
      </span>
    </button>
  );
}
