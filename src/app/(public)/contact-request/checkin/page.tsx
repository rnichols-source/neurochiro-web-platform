"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function CheckinPage() {
  return (
    <Suspense>
      <CheckinContent />
    </Suspense>
  );
}

function CheckinContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const token = searchParams.get("token");
  const answer = searchParams.get("answer");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<"reached" | "not_yet" | null>(null);
  const [error, setError] = useState("");

  async function respond(response: "reached" | "not_yet") {
    if (!token || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/contact-request/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, response }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Could not save your answer. Please try again.");
      else setDone(response);
    } catch {
      setError("Connection problem. Please try again.");
    }
    setSubmitting(false);
  }

  if (status === "invalid" || (answer && answer !== "reached" && answer !== "not_yet")) {
    return (
      <Shell>
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h1 className="text-xl font-heading font-black text-neuro-navy mb-2">Invalid link</h1>
        <p className="text-gray-500 text-sm mb-6">Use the buttons in the email we sent you.</p>
        <Link href="/directory" className="text-neuro-orange font-bold text-sm hover:underline">Browse the directory</Link>
      </Shell>
    );
  }

  if (done === "reached") {
    return (
      <Shell>
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-heading font-black text-neuro-navy mb-3">Glad they reached you</h1>
        <p className="text-gray-500">Thanks for letting us know. You&apos;re all set.</p>
      </Shell>
    );
  }

  if (done === "not_yet") {
    return (
      <Shell>
        <h1 className="text-2xl font-heading font-black text-neuro-navy mb-3">We&apos;ll follow up</h1>
        <p className="text-gray-500">Thanks for telling us. The NeuroChiro team will make sure the office gets your request.</p>
      </Shell>
    );
  }

  const chosen = answer === "not_yet" ? "not_yet" : answer === "reached" ? "reached" : null;

  return (
    <Shell>
      <h1 className="text-2xl font-heading font-black text-neuro-navy mb-3">Did the office reach you?</h1>
      <p className="text-gray-500 leading-relaxed mb-6">Your answer is saved only after you confirm.</p>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          disabled={submitting}
          onClick={() => respond("reached")}
          className={`w-full py-3.5 font-bold rounded-xl text-sm disabled:opacity-60 ${chosen === "not_yet" ? "bg-white text-neuro-navy border border-gray-200" : "bg-green-600 text-white"}`}
        >
          {submitting && chosen !== "not_yet" ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
          Yes, they reached me
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => respond("not_yet")}
          className={`w-full py-3.5 font-bold rounded-xl text-sm disabled:opacity-60 ${chosen === "not_yet" ? "bg-neuro-navy text-white" : "bg-white text-neuro-navy border border-gray-200"}`}
        >
          Not yet
        </button>
      </div>
      {error ? <p className="text-red-600 text-sm mt-4">{error}</p> : null}
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
