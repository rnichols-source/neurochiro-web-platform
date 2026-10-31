"use client";

import { useState } from "react";
import { createHostPackageCheckout, submitHostInterest } from "../register-actions";

export function HostInterestForm() {
  const [message, setMessage] = useState("");
  return (
    <form
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        const result = await submitHostInterest(new FormData(event.currentTarget));
        setMessage("error" in result && result.error ? result.error : "Submitted for review. We'll write back.");
      }}
    >
      <input name="name" required placeholder="Your name" className="min-h-11 w-full rounded-xl border border-black/10 px-3 text-base" />
      <input name="email" type="email" required placeholder="Email" className="min-h-11 w-full rounded-xl border border-black/10 px-3 text-base" />
      <input name="org" placeholder="Organization" className="min-h-11 w-full rounded-xl border border-black/10 px-3 text-base" />
      <input name="website" placeholder="https://" className="min-h-11 w-full rounded-xl border border-black/10 px-3 text-base" />
      <input name="topics" placeholder="Topics, separated by commas" className="min-h-11 w-full rounded-xl border border-black/10 px-3 text-base" />
      <button type="submit" className="inline-flex min-h-11 items-center rounded-xl bg-neuro-orange px-5 text-sm font-bold text-white">Apply to host</button>
      {message ? <p className="text-sm text-gray-600">{message}</p> : null}
    </form>
  );
}

export function PackageButton({ packageId, label }: { packageId: "single" | "annual"; label: string }) {
  const [message, setMessage] = useState("");
  return (
    <div>
      <button
        type="button"
        className="inline-flex min-h-11 items-center rounded-xl bg-neuro-navy px-4 text-sm font-bold text-white"
        onClick={async () => {
          const result = await createHostPackageCheckout(packageId);
          if ("error" in result) {
            setMessage(result.error);
            return;
          }
          if (result.url) window.location.href = result.url;
        }}
      >
        {label}
      </button>
      {message ? <p className="mt-2 text-sm text-gray-600">{message}</p> : null}
    </div>
  );
}
