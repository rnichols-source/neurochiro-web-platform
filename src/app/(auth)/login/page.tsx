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

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const redirectParam = searchParams.get("redirect");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isDevMode, setIsDevMode] = useState(false);

  useEffect(() => {
    // Check for dev mode flag in localStorage
    const devMode = typeof window !== 'undefined' && localStorage.getItem("nc_dev_mode") === "true";
    setIsDevMode(devMode);
  }, []);

  useEffect(() => {
    if (errorParam === "session_expired") {
      setErrorMsg("Your session has expired. Please log in again.");
    } else if (errorParam === "auth_failed") {
      setErrorMsg("Invalid email or password.");
    } else if (errorParam === "email_not_confirmed") {
      setErrorMsg("Please verify your email address before logging in.");
    }
  }, [errorParam]);

  const quickLogin = async (roleEmail: string) => {
    setIsPending(true);
    setErrorMsg(null);

    // Sync client-side state for tiers before redirecting
    if (roleEmail === "drray@neurochirodirectory.com" || roleEmail.includes("admin")) {
      localStorage.setItem("nc_dev_mode", "true");
    }

    if (roleEmail.includes("doctor_pro")) {
      localStorage.setItem("nc_doctor_tier", "pro");
    } else if (roleEmail.includes("doctor_growth")) {
      localStorage.setItem("nc_doctor_tier", "growth");
    } else if (roleEmail.includes("doctor")) {
      localStorage.setItem("nc_doctor_tier", "starter");
    }

    if (roleEmail.includes("student_paid")) {
      localStorage.setItem("nc_student_tier", "Professional");
    } else if (roleEmail.includes("student")) {
      localStorage.setItem("nc_student_tier", "Free");
    }

    try {
      const formData = new FormData();
      formData.append("email", roleEmail);
      formData.append("password", "password123");

      await login(formData, redirectParam);
    } catch (err) {
      if (!(err instanceof Error && err.message === 'NEXT_REDIRECT')) {
        console.error("Login Error:", err);
        setErrorMsg("Development login failed. Please try again.");
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className={`flex flex-col md:flex-row gap-8 items-center justify-center max-w-4xl w-full relative z-10 transition-all duration-500 ${isDevMode ? 'md:items-start' : 'items-center'}`}>
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

      {/* Quick Access Panel - Only visible in Dev Mode */}
      {isDevMode && (
        <div className="w-full max-w-sm bg-neuro-navy rounded-[3rem] p-8 text-white shadow-2xl border border-white/10 self-stretch flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="flex items-center gap-2 mb-8">
            <ShieldCheck className="w-5 h-5 text-neuro-orange" />
            <h2 className="text-lg font-heading font-bold uppercase tracking-widest">Dev Sandbox</h2>
          </div>
          
          <p className="text-[11px] text-gray-400 mb-6 font-medium leading-relaxed uppercase tracking-tighter">
            Quickly access different roles to test tier alignment and restricted features.
          </p>

          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="space-y-2">
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 block">Doctor Tiers</span>
              <button 
                onClick={() => quickLogin("doctor@neurochiro.com")}
                className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors group"
              >
                <span className="text-xs font-bold text-gray-300">Doctor (Starter)</span>
                <ArrowRight className="w-4 h-4 text-neuro-orange opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
              </button>
              <button 
                onClick={() => quickLogin("doctor_growth@neurochiro.com")}
                className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors group"
              >
                <span className="text-xs font-bold text-gray-300">Doctor (Growth)</span>
                <ArrowRight className="w-4 h-4 text-neuro-orange opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
              </button>
              <button 
                onClick={() => quickLogin("doctor_pro@neurochiro.com")}
                className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors group border border-neuro-orange/30"
              >
                <span className="text-xs font-bold text-neuro-orange">Doctor (Elite Pro)</span>
                <ArrowRight className="w-4 h-4 text-neuro-orange opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
              </button>
            </div>

            <div className="space-y-2 pt-4">
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 block">Student Tiers</span>
              <button 
                onClick={() => quickLogin("student@neurochiro.com")}
                className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors group"
              >
                <span className="text-xs font-bold text-gray-300">Student (Free)</span>
                <ArrowRight className="w-4 h-4 text-neuro-orange opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
              </button>
              <button 
                onClick={() => quickLogin("student_paid@neurochiro.com")}
                className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors group"
              >
                <span className="text-xs font-bold text-gray-300">Student (Paid)</span>
                <ArrowRight className="w-4 h-4 text-neuro-orange opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
              </button>
            </div>

            <div className="space-y-2 pt-4">
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 block">Public & Partners</span>
              <button 
                onClick={() => quickLogin("vendor@neurochiro.com")}
                className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors group"
              >
                <span className="text-xs font-bold text-gray-300">Vendor Partner</span>
                <ArrowRight className="w-4 h-4 text-neuro-orange opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
              </button>
              <button 
                onClick={() => quickLogin("patient@neurochiro.com")}
                className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors group"
              >
                <span className="text-xs font-bold text-gray-300">Patient Portal</span>
                <ArrowRight className="w-4 h-4 text-neuro-orange opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
              </button>
            </div>

            <div className="space-y-2 pt-4">
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 block">Administrative</span>
              <button 
                onClick={() => quickLogin("drray@neurochirodirectory.com")}
                className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors group border border-neuro-orange/30"
              >
                <span className="text-xs font-bold text-neuro-orange">Founder Login</span>
                <ArrowRight className="w-4 h-4 text-neuro-orange opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
              </button>
            </div>
          </div>
        </div>
      )}
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
