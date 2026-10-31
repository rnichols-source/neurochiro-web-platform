"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createHostPackageCheckout, submitHostInterest } from "../register-actions";
import type { SeminarPackageId } from "@/config/seminars";

export function HostInterestForm() {
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  return (
    <form
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        const result = await submitHostInterest(new FormData(event.currentTarget));
        if ("error" in result && result.error) {
          setFailed(true);
          setMessage(result.error);
          return;
        }
        setFailed(false);
        setMessage("Submitted for review. We'll write back.");
      }}
    >
      <input name="name" required placeholder="Your name" className="min-h-11 w-full rounded-xl border border-black/10 px-3 text-base" />
      <input name="email" type="email" required placeholder="Email" className="min-h-11 w-full rounded-xl border border-black/10 px-3 text-base" />
      <input name="org" placeholder="Organization" className="min-h-11 w-full rounded-xl border border-black/10 px-3 text-base" />
      <input name="website" placeholder="https://" className="min-h-11 w-full rounded-xl border border-black/10 px-3 text-base" />
      <input name="topics" placeholder="Topics, separated by commas" className="min-h-11 w-full rounded-xl border border-black/10 px-3 text-base" />
      <button type="submit" className="inline-flex min-h-11 items-center rounded-xl bg-neuro-orange-ink px-5 text-sm font-bold text-white">Apply to host</button>
      {message ? <p className={`text-sm ${failed ? "font-bold text-red-700" : "text-gray-600"}`}>{message}</p> : null}
    </form>
  );
}

export function PackageButton({ packageId, label, enabled, loggedIn }: { packageId: SeminarPackageId; label: string; enabled: boolean; loggedIn: boolean }) {
  const [message, setMessage] = useState("");
  if (!enabled) return <p className="text-sm font-bold text-neuro-orange-ink">Coming soon — apply below</p>;
  if (!loggedIn) {
    const next = `/seminars/host?pkg=${packageId}`;
    return (
      <Link href={`/login?redirect=${encodeURIComponent(next)}`} className="inline-flex min-h-11 items-center rounded-xl bg-neuro-navy px-4 text-sm font-bold text-white">
        {label}
      </Link>
    );
  }
  return (
    <div>
      <button
        type="button"
        className="inline-flex min-h-11 items-center rounded-xl bg-neuro-navy px-4 text-sm font-bold text-white"
        onClick={async () => {
          const result = await createHostPackageCheckout(packageId);
          if ("error" in result) {
            if ("loginUrl" in result && result.loginUrl) {
              window.location.href = result.loginUrl;
              return;
            }
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

export function ResumeCheckout({ packageId }: { packageId: "single" | "annual" }) {
  const [message, setMessage] = useState("Opening checkout…");
  useEffect(() => {
    let cancel = false;
    createHostPackageCheckout(packageId).then((result) => {
      if (cancel) return;
      if ("error" in result) {
        setMessage(result.error);
        return;
      }
      if (result.url) window.location.href = result.url;
    });
    return () => {
      cancel = true;
    };
  }, [packageId]);
  return <p className="mt-4 text-sm font-bold text-neuro-navy">{message}</p>;
}

export function FeaturedPackage({ enabled, loggedIn }: { enabled: boolean; loggedIn: boolean }) {
  if (!enabled) return <p className="mt-4 text-sm font-bold text-neuro-orange-ink">Coming soon — apply below</p>;
  if (!loggedIn) {
    return (
      <Link href={`/login?redirect=${encodeURIComponent("/seminars/host")}`} className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-neuro-navy px-4 text-sm font-bold text-white">
        Log in to feature a listing
      </Link>
    );
  }
  return (
    <Link href="/doctor/seminars" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-neuro-navy px-4 text-sm font-bold text-white">
      Feature an existing listing
    </Link>
  );
}
