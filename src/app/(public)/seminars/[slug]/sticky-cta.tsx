"use client";

import { useEffect, useState } from "react";

export function StickyRegister({ href, price, label }: { href: string; price: string; label: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const hero = document.getElementById("hero-register");
    const tickets = document.getElementById("tickets");
    let heroVisible = Boolean(hero);
    let ticketsVisible = false;
    const sync = () => setShow(!heroVisible && !ticketsVisible);
    const heroObserver = new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      sync();
    }, { threshold: 0.15 });
    const ticketObserver = new IntersectionObserver(([entry]) => {
      ticketsVisible = entry.isIntersecting;
      sync();
    }, { threshold: 0.15 });
    if (hero) heroObserver.observe(hero);
    else heroVisible = false;
    if (tickets) ticketObserver.observe(tickets);
    sync();
    return () => {
      heroObserver.disconnect();
      ticketObserver.disconnect();
    };
  }, []);
  if (!show) return null;
  return (
    <div className="nc-seminar-cta fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 px-4 py-3 backdrop-blur lg:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
        <p className="text-sm font-black text-neuro-navy">{price}</p>
        <a href={href} className="inline-flex min-h-11 items-center rounded-xl bg-neuro-orange-ink px-5 text-sm font-bold text-white">{label}</a>
      </div>
    </div>
  );
}
