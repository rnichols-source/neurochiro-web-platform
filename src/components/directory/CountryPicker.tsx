"use client";

import { useEffect, useRef } from "react";
import type { CountryOption } from "./useDirectorySearch";

export default function CountryPicker({
  open,
  onClose,
  countries,
  selected,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  countries: CountryOption[];
  selected: string;
  onSelect: (code: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const root = ref.current;
    const nodes = root ? Array.from(root.querySelectorAll<HTMLElement>("button")) : [];
    nodes[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[240] bg-black/60" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="Where are you looking?"
        className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-[#1c1c1e] p-4 pb-[calc(16px+env(safe-area-inset-bottom))]"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-white mb-3">Where are you looking?</h2>
        <ul className="space-y-1">
          {countries.map((country) => (
            <li key={country.code}>
              <button
                type="button"
                onClick={() => { onSelect(country.code); onClose(); }}
                className={`flex min-h-14 w-full items-center gap-3 rounded-xl px-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-neuro-orange ${selected === country.code ? "bg-neuro-orange text-white" : "text-white"}`}
              >
                <span className="text-2xl" aria-hidden>{country.flag}</span>
                <span className="flex-1 font-semibold">{country.label}</span>
                <span className="text-sm opacity-80">{country.count}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
