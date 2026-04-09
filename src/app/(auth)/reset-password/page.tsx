"use client";
import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [sessionReady, setSessionReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    const supabase = createClient();
    const code = searchParams.get("code");

    // If there's a code in the URL, exchange it for a session
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (!error) {
          setSessionReady(true);
        }
        setChecking(false);
      });
      return;
    }

    // Listen for PASSWORD_RECOVERY event (hash-based flow)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
        setChecking(false);
      }
    });

    // Also check if there's already a session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      }
      setChecking(false);
    });

    return () => subscription.unsubscribe();
  }, [searchParams]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      if (error.message.includes("session") || error.message.includes("Auth")) {
        setError("Your reset link has expired. Please request a new one from the login page.");
      } else {
        setError(error.message);
      }
    } else {
      setDone(true);
    }
  };

  if (done) return (
    <div className="min-h-dvh bg-neuro-cream flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-heading font-black text-neuro-navy mb-4">Password Updated!</h1>
        <p className="text-gray-500 mb-6">Your password has been set. You can now log in.</p>
        <Link href="/login" className="px-6 py-3 bg-neuro-orange text-white font-bold rounded-xl inline-block">Log In</Link>
      </div>
    </div>
  );

  if (checking) return (
    <div className="min-h-dvh bg-neuro-cream flex items-center justify-center p-6">
      <div className="w-8 h-8 border-4 border-neuro-orange border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!sessionReady) return (
    <div className="min-h-dvh bg-neuro-cream flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-heading font-black text-neuro-navy mb-4">Reset Link Expired</h1>
        <p className="text-gray-500 mb-6">This password reset link has expired or was already used. Request a new one from the login page.</p>
        <Link href="/login" className="px-6 py-3 bg-neuro-orange text-white font-bold rounded-xl inline-block">Go to Login</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-neuro-cream flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-heading font-black text-neuro-navy mb-2 text-center">Set Your Password</h1>
        <p className="text-gray-500 text-center mb-8">Choose a password for your NeuroChiro account.</p>
        <form onSubmit={handleReset} className="space-y-4">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password (8+ characters)" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange" required minLength={8} />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="w-full py-3 bg-neuro-orange text-white font-bold rounded-xl">Set New Password</button>
        </form>
        <p className="text-center mt-4"><Link href="/login" className="text-sm text-neuro-orange font-bold hover:underline">Back to login</Link></p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-neuro-cream flex items-center justify-center p-6"><div className="w-8 h-8 border-4 border-neuro-orange border-t-transparent rounded-full animate-spin" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
