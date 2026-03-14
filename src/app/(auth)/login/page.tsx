"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowRight, 
  ShieldCheck, 
  Lock,
  Mail,
  ChevronLeft,
  AlertCircle,
  Loader2
} from "lucide-react";
import { login, signInWithProvider } from "../actions/auth";
import { unstable_noStore as noStore } from 'next/cache';

function LoginContent() {
  noStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const redirectParam = searchParams.get("redirect");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (errorParam === "session_expired") {
      setErrorMsg("Your session has expired. Please log in again.");
    } else if (errorParam === "auth_failed") {
      setErrorMsg("Invalid email or password.");
    } else if (errorParam === "email_not_confirmed") {
      setErrorMsg("Please verify your email address before logging in.");
    }
  }, [errorParam]);

  return (
    <div className="flex flex-col md:flex-row gap-8 items-center justify-center max-w-4xl w-full relative z-10 transition-all duration-500 items-center">
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl border border-gray-100 p-10">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-neuro-navy transition-colors mb-10">
          <ChevronLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-neuro-navy rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto mb-4 shadow-xl">N</div>
          <h1 className="text-3xl font-heading font-black text-neuro-navy mb-2">Welcome Back</h1>
          <p className="text-gray-500 text-sm">Log in to your NeuroChiro account.</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {errorMsg}
          </div>
        )}

        <div className="space-y-3 mb-8">
          <button 
            onClick={() => signInWithProvider('google')}
            className="w-full py-4 px-6 border-2 border-gray-100 rounded-2xl flex items-center justify-center gap-3 text-sm font-bold text-neuro-navy hover:bg-gray-50 transition-all"
          >
            <img loading="lazy" decoding="async" src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
            Continue with Google
          </button>
        </div>

        <div className="relative flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-gray-100"></div>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Or login with email</span>
          <div className="flex-1 h-px bg-gray-100"></div>
        </div>

        <form 
          action={async (formData) => {
            setIsPending(true);
            await login(formData, redirectParam);
            setIsPending(false);
          }} 
          className="space-y-4"
        >
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                name="email"
                type="email" 
                required
                autoComplete="email"
                placeholder="email@neurochiro.com"
                className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center ml-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Password</label>
              <button type="button" className="text-[10px] font-bold text-neuro-orange hover:underline uppercase tracking-widest">Forgot?</button>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                name="password"
                type="password" 
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isPending}
            className="w-full py-5 bg-neuro-navy text-white font-black rounded-2xl hover:bg-neuro-navy-light transition-all shadow-xl shadow-neuro-navy/20 mt-6 uppercase tracking-widest disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
          </button>
        </form>

        <div className="mt-10 text-center space-y-4">
          <p className="text-sm text-gray-400">Don't have an account yet?</p>
          <Link 
            href="/register" 
            className="inline-flex items-center gap-2 px-8 py-3 border-2 border-gray-50 rounded-xl text-xs font-black text-neuro-navy uppercase tracking-widest hover:border-neuro-orange transition-all"
          >
            Create Account <ArrowRight className="w-4 h-4 text-neuro-orange" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-neuro-cream flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-neuro-navy/5 blur-[120px] -ml-48 -mt-48"></div>
      
      <Suspense fallback={
        <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl border border-gray-100 p-10 relative z-10 flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neuro-orange"></div>
        </div>
      }>
        <LoginContent />
      </Suspense>
    </div>
  );
}
