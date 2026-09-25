"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";
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

  if (status === "invalid") {
    return (
      <div className="min-h-dvh bg-neuro-cream flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-heading font-black text-neuro-navy mb-2">Invalid Link</h1>
          <p className="text-gray-500 text-sm mb-6">
            This withdrawal link is invalid or has expired.
          </p>
          <Link href="/directory" className="text-neuro-orange font-bold text-sm hover:underline">
            Browse the directory
          </Link>
        </div>
      </div>
    );
  }

  if (status === "already") {
    return (
      <div className="min-h-dvh bg-neuro-cream flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <Info className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h1 className="text-xl font-heading font-black text-neuro-navy mb-2">Already Withdrawn</h1>
          <p className="text-gray-500 text-sm mb-6">
            This contact request was already withdrawn. No further action is needed.
          </p>
          <Link href="/directory" className="text-neuro-orange font-bold text-sm hover:underline">
            Browse the directory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-neuro-cream flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-heading font-black text-neuro-navy mb-3">
          Request Withdrawn
        </h1>
        <p className="text-gray-500 leading-relaxed mb-2">
          Your contact request has been withdrawn. The doctor's office has been notified not to contact you.
        </p>
        <p className="text-sm text-gray-400 mb-8">
          Your consent record has been updated.
        </p>
        <Link href="/directory" className="text-neuro-orange font-bold text-sm hover:underline">
          Browse the directory
        </Link>
      </div>
    </div>
  );
}
