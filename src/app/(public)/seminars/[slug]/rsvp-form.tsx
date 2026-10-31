"use client";

import { useState } from "react";
import { rsvpForSeminar } from "../register-actions";

export function RsvpForm({ slug, email }: { slug: string; email?: string | null }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <form
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        const result = await rsvpForSeminar(slug, new FormData(event.currentTarget));
        setPending(false);
        setMessage(result.error || "You're on the reminder list.");
      }}
    >
      <label className="block text-sm font-bold text-neuro-navy">
        Name
        <input name="name" className="mt-1 w-full min-h-11 rounded-xl border border-gray-200 px-3 text-base" autoComplete="name" />
      </label>
      <label className="block text-sm font-bold text-neuro-navy">
        Email
        <input name="email" type="email" required defaultValue={email || ""} className="mt-1 w-full min-h-11 rounded-xl border border-gray-200 px-3 text-base" autoComplete="email" />
      </label>
      <button type="submit" disabled={pending} className="inline-flex min-h-11 items-center rounded-xl bg-neuro-navy px-5 text-sm font-bold text-white">
        {pending ? "Saving..." : "I'm going — remind me"}
      </button>
      {message ? <p className="text-sm text-gray-600">{message}</p> : null}
    </form>
  );
}
