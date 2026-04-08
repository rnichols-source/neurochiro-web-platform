"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const role = searchParams.get("role") || "doctor";
  const dashboard = role === "student" ? "/student/dashboard" : role === "patient" ? "/portal/dashboard" : "/doctor/dashboard";

  return (
    <div className="min-h-dvh bg-neuro-cream flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-heading font-black text-neuro-navy mb-2">Payment Successful!</h1>
        <p className="text-gray-500 text-lg mb-10">Your membership is active. Welcome to NeuroChiro.</p>
        <Link
          href={dashboard}
          className="inline-flex items-center gap-2 px-8 py-4 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors"
        >
          Go to Dashboard <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center"><div className="w-8 h-8 border-4 border-neuro-orange border-t-transparent rounded-full animate-spin" /></div>}>
      <SuccessContent />
    </Suspense>
  );
}
