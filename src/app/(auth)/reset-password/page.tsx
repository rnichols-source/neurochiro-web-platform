"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  const expiredParam = searchParams.get("expired");

  const [step, setStep] = useState<"code" | "done">(expiredParam ? "code" : "code");
  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleResendCode = async () => {
    if (!email) { setError("Enter your email first."); return; }
    setResending(true);
    setError("");
    await fetch("/api/auth/reset-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setResending(false);
    setError("New code sent! Check your email.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !code || !password) { setError("All fields are required."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }

    setLoading(true);
    const res = await fetch("/api/auth/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, newPassword: password }),
    });
    const data = await res.json();
    setLoading(false);

    if (data.error) {
      setError(data.error);
    } else {
      setStep("done");
    }
  };

  if (step === "done") {
    return (
      <div className="min-h-dvh bg-neuro-cream flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-heading font-black text-neuro-navy mb-4">Password Updated!</h1>
          <p className="text-gray-500 mb-6">Your password has been set. You can now log in.</p>
          <Link href="/login" className="px-6 py-3 bg-neuro-orange text-white font-bold rounded-xl inline-block">Log In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-neuro-cream flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-heading font-black text-neuro-navy mb-2 text-center">Set Your Password</h1>
        <p className="text-gray-500 text-center mb-8">Enter the 6-digit code from your email and choose a new password.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">6-Digit Code</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              inputMode="numeric"
              maxLength={6}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange text-center text-2xl font-mono tracking-widest"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">New Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              minLength={8}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange"
            />
          </div>

          {error && <p className={`text-sm font-bold ${error.includes('sent') ? 'text-green-600' : 'text-red-500'}`}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-neuro-orange text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Setting Password...</> : "Set New Password"}
          </button>
        </form>

        <div className="text-center mt-6 space-y-2">
          <button
            onClick={handleResendCode}
            disabled={resending}
            className="text-sm text-neuro-orange font-bold hover:underline disabled:opacity-50"
          >
            {resending ? "Sending..." : "Didn't get the code? Resend it"}
          </button>
          <p>
            <Link href="/login" className="text-sm text-gray-400 hover:underline">Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-neuro-cream flex items-center justify-center"><Loader2 className="w-8 h-8 text-neuro-orange animate-spin" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
