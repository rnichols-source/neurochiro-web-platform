"use client";

import { useEffect, useState } from "react";

export function StickyRegister({ href, price, label }: { href: string; price: string; label: string }) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const target = document.getElementById("tickets");
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setHidden(entry.isIntersecting), { threshold: 0.35 });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);
  if (hidden) return null;
  return (
    <div className="nc-seminar-cta fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 px-4 py-3 backdrop-blur lg:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
        <p className="text-sm font-black text-neuro-navy">{price}</p>
        <a href={href} className="inline-flex min-h-11 items-center rounded-xl bg-neuro-orange px-5 text-sm font-bold text-white">{label}</a>
      </div>
    </div>
  );
}
