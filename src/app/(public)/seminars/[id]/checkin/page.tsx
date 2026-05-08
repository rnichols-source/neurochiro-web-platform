"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Loader2, Award, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function SeminarCheckInPage() {
  const { id } = useParams();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleCheckIn = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/seminars/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seminarId: id }),
      });
      const data = await res.json();

      if (data.alreadyCheckedIn) {
        setResult(data);
        setStatus("success");
        return;
      }

      if (data.error) {
        setError(data.error);
        setStatus("error");
        return;
      }

      setResult(data);
      setStatus("success");
    } catch {
      setError("Check-in failed. Please try again.");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-dvh bg-neuro-cream flex items-center justify-center px-6 pt-24 pb-20">
      <div className="max-w-md w-full text-center">
        {status === "idle" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8 space-y-6">
            <div className="w-16 h-16 bg-neuro-orange/10 rounded-full flex items-center justify-center mx-auto">
              <Award className="w-8 h-8 text-neuro-orange" />
            </div>
            <h1 className="text-2xl font-heading font-black text-neuro-navy">Seminar Check-In</h1>
            <p className="text-gray-500 text-sm">Tap below to confirm your attendance and earn your CE credits.</p>
            <button
              onClick={handleCheckIn}
              className="w-full py-4 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors text-lg"
            >
              Check In Now
            </button>
            <p className="text-xs text-gray-400">You must be logged in and registered for this seminar.</p>
          </div>
        )}

        {status === "loading" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8">
            <Loader2 className="w-10 h-10 text-neuro-orange animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Checking you in...</p>
          </div>
        )}

        {status === "success" && (
          <div className="bg-white rounded-2xl border border-green-200 shadow-xl p-8 space-y-4">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-heading font-black text-neuro-navy">Checked In!</h1>
            {result?.ceHours > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-blue-700 font-bold">{result.ceHours} CE Hours Earned</p>
                {result.certificateNumber && (
                  <p className="text-blue-600 text-xs mt-1">Certificate: {result.certificateNumber}</p>
                )}
              </div>
            )}
            {result?.seminarTitle && (
              <p className="text-gray-500 text-sm">{result.seminarTitle}</p>
            )}
            <Link href="/doctor/ce-tracker" className="text-neuro-orange text-sm font-bold hover:underline block">
              View your CE credits &rarr;
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="bg-white rounded-2xl border border-red-200 shadow-xl p-8 space-y-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-heading font-black text-neuro-navy">Check-In Failed</h1>
            <p className="text-red-600 text-sm">{error}</p>
            <button onClick={() => { setStatus("idle"); setError(""); }} className="text-neuro-orange text-sm font-bold hover:underline">
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
