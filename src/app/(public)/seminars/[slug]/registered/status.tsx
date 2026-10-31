"use client";

import { useEffect, useState } from "react";

export function RegistrationStatus({ slug, registrationId, sessionId }: { slug: string; registrationId: string; sessionId: string }) {
  const [status, setStatus] = useState("pending");
  useEffect(() => {
    if (!registrationId) return;
    let stopped = false;
    const load = async () => {
      const response = await fetch(`/api/seminars/registration-status?registration=${encodeURIComponent(registrationId)}&session_id=${encodeURIComponent(sessionId)}&slug=${encodeURIComponent(slug)}`);
      if (!response.ok) return;
      const body = await response.json();
      if (!stopped && body.status) setStatus(body.status);
    };
    load();
    const id = window.setInterval(load, 2000);
    const stop = window.setTimeout(() => window.clearInterval(id), 15000);
    return () => {
      stopped = true;
      window.clearInterval(id);
      window.clearTimeout(stop);
    };
  }, [registrationId, sessionId, slug]);
  return <p className="mt-4 text-lg font-black text-neuro-navy">{status === "paid" ? "Payment confirmed." : "Confirming your payment..."}</p>;
}
