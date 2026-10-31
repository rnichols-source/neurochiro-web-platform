"use client";

import { useEffect, useId, useRef, useState } from "react";

export function FilterSheet({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const node = panel.current;
    const focusable = node?.querySelectorAll<HTMLElement>("a, button");
    focusable?.[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
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
  }, [open]);

  return (
    <>
      <button type="button" className="min-h-11 rounded-full bg-neuro-navy px-4 text-sm font-bold text-white lg:hidden" onClick={() => setOpen(true)}>
        Filters
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close filters" onClick={() => setOpen(false)} />
          <div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id={titleId} className="text-lg font-black text-neuro-navy">Filters</h2>
              <button type="button" className="min-h-11 px-3 text-sm font-bold" onClick={() => setOpen(false)}>Close</button>
            </div>
            <div className="flex flex-col gap-2 text-base" onClick={() => setOpen(false)}>{children}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
