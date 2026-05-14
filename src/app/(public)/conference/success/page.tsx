"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  return (
    <div className="min-h-dvh bg-neuro-cream flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-10">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>

          <h1 className="text-2xl font-heading font-black text-neuro-navy mb-2">
            Welcome to NeuroChiro!
          </h1>
          <p className="text-gray-500 mb-6">
            Your account is being set up. You can log in now with the email and password you just created.
          </p>

          {email && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Your Login Email</p>
              <p className="text-sm font-bold text-neuro-navy">{email}</p>
            </div>
          )}

          <Link
            href="/login"
            className="w-full py-4 bg-neuro-orange text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-neuro-orange/90 transition-colors"
          >
            Log In to Your Portal <ArrowRight className="w-5 h-5" />
          </Link>

          <p className="text-xs text-gray-400 mt-4">
            Your profile will be visible in the directory within minutes.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ConferenceSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-neuro-cream flex items-center justify-center"><div className="w-8 h-8 border-4 border-neuro-orange border-t-transparent rounded-full animate-spin" /></div>}>
      <SuccessContent />
    </Suspense>
  );
}
