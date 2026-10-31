"use client";

import { useEffect, useState } from "react";

export function Countdown({ start }: { start: string }) {
  const [label, setLabel] = useState("Upcoming");
  useEffect(() => {
    const tick = () => {
      const diff = new Date(`${start}T12:00:00Z`).getTime() - Date.now();
      if (diff <= 0) {
        setLabel("Happening now");
        return;
      }
      const days = Math.ceil(diff / 86400000);
      setLabel(days === 1 ? "1 day to go" : `${days} days to go`);
    };
    tick();
    const id = window.setInterval(tick, 60000);
    return () => window.clearInterval(id);
  }, [start]);
  return <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">{label}</span>;
}
