"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setError(error.message); } else { setDone(true); }
  };

  if (done) return (
    <div className="min-h-dvh bg-neuro-cream flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-heading font-black text-neuro-navy mb-4">Password Updated</h1>
        <p className="text-gray-500 mb-6">Your password has been reset successfully.</p>
        <Link href="/login" className="px-6 py-3 bg-neuro-orange text-white font-bold rounded-xl inline-block">Log In</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-neuro-cream flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-heading font-black text-neuro-navy mb-2 text-center">Reset Your Password</h1>
        <p className="text-gray-500 text-center mb-8">Enter your new password below.</p>
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
