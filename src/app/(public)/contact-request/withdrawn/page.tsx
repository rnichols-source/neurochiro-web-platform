"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, AlertCircle, Info, Loader2 } from "lucide-react";
import Link from "next/link";

export default function WithdrawnPage() {
  return (
    <Suspense>
      <WithdrawnContent />
    </Suspense>
  );
}

function WithdrawnContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const token = searchParams.get("token");
  const confirm = searchParams.get("confirm") === "1";
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function withdraw() {
    if (!token || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/contact-request/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Could not withdraw this request. Please try again.");
      else setDone(true);
    } catch {
      setError("Connection problem. Please try again.");
    }
    setSubmitting(false);
  }

  if (confirm && token && !done) {
    return (
      <Shell>
        <Info className="w-12 h-12 text-neuro-orange mx-auto mb-4" />
        <h1 className="text-2xl font-heading font-black text-neuro-navy mb-3">Withdraw this request?</h1>
        <p className="text-gray-500 leading-relaxed mb-6">
          The office will be told not to contact you. This does not happen until you confirm.
        </p>
        <button
          type="button"
          onClick={withdraw}
          disabled={submitting}
          className="w-full py-3.5 bg-neuro-orange text-white font-bold rounded-xl text-sm disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Yes, withdraw my request
        </button>
        {error ? <p className="text-red-600 text-sm mt-4">{error}</p> : null}
      </Shell>
    );
  }

  if (status === "invalid") {
    return (
      <Shell>
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h1 className="text-xl font-heading font-black text-neuro-navy mb-2">Invalid Link</h1>
        <p className="text-gray-500 text-sm mb-6">This withdrawal link is invalid or has expired.</p>
        <DirectoryLink />
      </Shell>
    );
  }

  if (status === "already") {
    return (
      <Shell>
        <Info className="w-12 h-12 text-blue-400 mx-auto mb-4" />
        <h1 className="text-xl font-heading font-black text-neuro-navy mb-2">Already Withdrawn</h1>
        <p className="text-gray-500 text-sm mb-6">This contact request was already withdrawn. No further action is needed.</p>
        <DirectoryLink />
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-10 h-10 text-green-600" />
      </div>
      <h1 className="text-2xl font-heading font-black text-neuro-navy mb-3">Request Withdrawn</h1>
      <p className="text-gray-500 leading-relaxed mb-2">
        Your contact request has been withdrawn. The doctor&apos;s office has been notified not to contact you.
      </p>
      <p className="text-sm text-gray-400 mb-8">Your consent record has been updated.</p>
      <DirectoryLink />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-neuro-cream flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">{children}</div>
    </div>
  );
}

function DirectoryLink() {
  return (
    <Link href="/directory" className="text-neuro-orange font-bold text-sm hover:underline">
      Browse the directory
    </Link>
  );
}
