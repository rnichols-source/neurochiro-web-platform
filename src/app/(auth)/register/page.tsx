"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRegion } from "@/context/RegionContext";
import { 
  GraduationCap, 
  User, 
  Building2, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles,
  ChevronLeft,
  Zap,
  Target,
  Check,
  Trophy,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Suspense } from "react";
import { register, signInWithProvider } from "../actions/auth";

type Role = "student" | "doctor" | "patient" | "admin";
type Tier = "free" | "foundation" | "professional" | "accelerator" | "starter" | "growth" | "pro";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const { region } = useRegion();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role | null>(null);
  const [tier, setTier] = useState<Tier>("free");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [formData, setBaseFormData] = useState({
    name: "",
    email: "",
    password: "",
    school: "",
    gradYear: "",
    clinicName: "",
  });
  const [isPending, setIsPending] = useState(false);

  const handleRoleSelect = (selectedRole: Role) => {
    setRole(selectedRole);
    if (selectedRole === "patient") {
      setTier("free");
      setStep(3); // Skip tier selection for patients as they are all free
    } else if (selectedRole === "student") {
      setTier("professional");
      setStep(2);
    } else if (selectedRole === "doctor") {
      setTier("growth");
      setStep(2);
    } else {
      router.push("/");
    }
  };

  const handleTierSelect = (selectedTier: Tier) => {
    setTier(selectedTier);
    setStep(3);
  };

  const studentTiers = [
    {
      id: "free",
      name: "Free",
      price: "0",
      desc: "Basic entry into the student ecosystem.",
      icon: Target,
      features: ["Basic Student Profile", "Browse Clinic Directory", "Browse Global Seminars", "Public Community Access"],
      color: "bg-white",
      border: "border-gray-100",
      featured: false
    },
    {
      id: "foundation",
      name: "Foundation",
      price: region.pricing.student.foundation[billingCycle],
      desc: "Explore the ecosystem and find your path.",
      icon: Trophy,
      features: ["Advanced Profile Features", "Save Clinics & Seminars", "Direct Messaging Basics", "Basic Progress Tracking"],
      color: "bg-white",
      border: "border-gray-100",
      featured: false
    },
    {
      id: "professional",
      name: "Professional",
      price: region.pricing.student.professional[billingCycle],
      desc: "The core career operating system for students.",
      icon: Zap,
      features: ["Full Profile Visibility", "Unlimited Direct Messaging", "Job & Preceptorship Apps", "Intro Video & Resume Upload", "Career Readiness Tracking"],
      color: "bg-neuro-navy text-white",
      border: "border-neuro-orange",
      featured: true,
      tag: "Most Popular"
    },
    {
      id: "accelerator",
      name: "Accelerator",
      price: region.pricing.student.accelerator[billingCycle],
      desc: "A premium advantage for serious career builders.",
      icon: Sparkles,
      features: ["Priority Clinic Matching", "Advanced Contract Lab", "Offer Evaluation Tool", "Featured Student Profile", "Direct Mentorship Requests"],
      color: "bg-white",
      border: "border-gray-100",
      featured: false
    }
  ];

  const doctorTiers = [
    {
      id: "starter",
      name: "Starter",
      price: region.pricing.doctor.starter[billingCycle],
      desc: "Establish your presence in the community.",
      icon: Target,
      features: ["Standard Directory Listing", "Basic Practice Profile", "Referral Network Access", "Basic Profile Analytics"],
      color: "bg-white",
      border: "border-gray-100",
      featured: false
    },
    {
      id: "growth",
      name: "Growth",
      price: region.pricing.doctor.growth[billingCycle],
      desc: "The complete toolkit for expanding clinical influence.",
      icon: Zap,
      features: ["Verified Badge", "Student Recruiting Tools", "Seminar Hosting (Public)", "Mentorship Listing", "Traffic Source Analytics"],
      color: "bg-neuro-navy text-white",
      border: "border-neuro-orange",
      featured: true,
      tag: "Most Popular"
    },
    {
      id: "pro",
      name: "Pro",
      price: region.pricing.doctor.pro[billingCycle],
      desc: "Dominant visibility and advanced clinical leadership.",
      icon: Sparkles,
      features: ["Featured Placement", "Priority Seminar Visibility", "Unlimited Job Postings", "Candidate Search Access", "Advanced Analytics Suite"],
      color: "bg-white",
      border: "border-gray-100",
      featured: false
    }
  ];

  return (
    <div className="min-h-screen bg-neuro-cream flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-neuro-orange/5 blur-[120px] -mr-48 -mt-48"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-neuro-navy/5 blur-[120px] -ml-48 -mb-48"></div>

      <div className={`w-full ${step === 2 ? 'max-w-7xl' : 'max-w-xl'} bg-white rounded-[3rem] shadow-2xl border border-gray-100 p-10 relative z-10 transition-all duration-500`}>

        <div className="flex justify-center gap-2 mb-10">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step >= i ? 'w-8 bg-neuro-orange' : 'w-2 bg-gray-100'}`}></div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-heading font-black text-neuro-navy mb-2">Welcome to NeuroChiro</h1>
              <p className="text-gray-500">Choose your entry point into the ecosystem.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={() => handleRoleSelect("student")}
                className="flex items-center gap-6 p-6 rounded-[2rem] border-2 border-gray-50 hover:border-neuro-orange hover:bg-neuro-orange/5 transition-all group text-left"
              >
                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-neuro-navy">I am a Student</h3>
                  <p className="text-sm text-gray-500">Access seminars and career tools.</p>
                </div>
                <ArrowRight className="w-5 h-5 ml-auto text-gray-300 group-hover:text-neuro-orange group-hover:translate-x-1 transition-all" />
              </button>

              <button 
                onClick={() => handleRoleSelect("patient")}
                className="flex items-center gap-6 p-6 rounded-[2rem] border-2 border-gray-50 hover:border-neuro-orange hover:bg-neuro-orange/5 transition-all group text-left"
              >
                <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-neuro-navy">I am a Patient</h3>
                  <p className="text-sm text-gray-500">Track your clinical progress for free.</p>
                </div>
                <ArrowRight className="w-5 h-5 ml-auto text-gray-300 group-hover:text-neuro-orange group-hover:translate-x-1 transition-all" />
              </button>

              <button 
                onClick={() => handleRoleSelect("doctor")}
                className="flex items-center gap-6 p-6 rounded-[2rem] border-2 border-gray-50 hover:border-neuro-orange hover:bg-neuro-orange/5 transition-all group text-left"
              >
                <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center text-neuro-orange group-hover:bg-neuro-orange group-hover:text-white transition-all">
                  <Building2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-neuro-navy">I am a Doctor</h3>
                  <p className="text-sm text-gray-500">List your practice and recruit talent.</p>
                </div>
                <ArrowRight className="w-5 h-5 ml-auto text-gray-300 group-hover:text-neuro-orange group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <button onClick={() => setStep(1)} className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-neuro-navy transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <div className="text-center">
              <h2 className="text-3xl font-heading font-black text-neuro-navy mb-2">Choose your membership</h2>
              <p className="text-gray-500 mb-8">Select the level of access you need.</p>
              
              {/* Billing Cycle Toggle */}
              <div className="flex items-center justify-center gap-4 mb-10">
                <span className={`text-xs font-black uppercase tracking-widest ${billingCycle === 'monthly' ? 'text-neuro-navy' : 'text-gray-400'}`}>Monthly</span>
                <button 
                  onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
                  className="w-14 h-7 bg-gray-100 rounded-full relative p-1 transition-colors hover:bg-gray-200"
                >
                  <motion.div 
                    animate={{ x: billingCycle === 'monthly' ? 0 : 28 }}
                    className="w-5 h-5 bg-neuro-orange rounded-full shadow-sm"
                  />
                </button>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-black uppercase tracking-widest ${billingCycle === 'annual' ? 'text-neuro-navy' : 'text-gray-400'}`}>Annual</span>
                  <span className="bg-green-100 text-green-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">2 Months Free</span>
                </div>
              </div>
            </div>

            <div className={`grid grid-cols-1 ${role === "student" ? "md:grid-cols-4" : "md:grid-cols-3"} gap-6`}>
              {(role === "student" ? studentTiers : doctorTiers).map((t) => (
                <div 
                  key={t.id}
                  onClick={() => handleTierSelect(t.id as Tier)}
                  className={`${t.color} p-8 rounded-[2rem] border-2 ${t.border} hover:scale-[1.02] cursor-pointer transition-all relative group flex flex-col h-full ${t.featured ? 'shadow-2xl scale-105 z-20' : 'shadow-sm'}`}
                >
                  {t.featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-neuro-orange text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                      {t.tag}
                    </div>
                  )}
                  <div className="mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${t.featured ? 'bg-white/10 text-neuro-orange' : 'bg-neuro-orange/10 text-neuro-orange'}`}>
                      <t.icon className="w-6 h-6" />
                    </div>
                    <h3 className={`text-xl font-black ${t.featured ? 'text-white' : 'text-neuro-navy'}`}>{t.name}</h3>
                    <div className="flex flex-col mt-1">
                      <div className="flex items-baseline gap-1">
                        <span className={`text-lg font-black ${t.featured ? 'text-white' : 'text-neuro-navy'}`}>{region.currency.symbol}{t.price}</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${t.featured ? 'text-white/50' : 'text-gray-400'}`}>
                          / {billingCycle === 'monthly' ? 'month' : 'year'}
                        </span>
                      </div>
                      {billingCycle === 'annual' && t.id !== 'free' && (
                        <span className="text-[9px] font-bold text-green-500 uppercase tracking-tighter">
                          Save {region.currency.symbol}{(Number(t.price) / 10) * 2} per year
                        </span>
                      )}
                    </div>
                  </div>
                  <p className={`text-xs mb-6 ${t.featured ? 'text-gray-300' : 'text-gray-500'}`}>{t.desc}</p>
                  <ul className="space-y-3 mb-8 flex-1">
                    {t.features.map((f, i) => (
                      <li key={i} className={`flex items-start gap-2 text-[10px] font-bold ${t.featured ? 'text-gray-200' : 'text-gray-400'}`}>
                        <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${t.featured ? 'bg-neuro-orange/20 text-neuro-orange' : 'bg-green-50 text-green-500'}`}>
                          <Check className="w-2.5 h-2.5 stroke-[4px]" />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className={`w-full py-3 font-black rounded-xl text-xs text-center transition-all ${t.featured ? 'bg-neuro-orange text-white hover:bg-neuro-orange-light shadow-lg' : 'bg-gray-50 text-neuro-navy group-hover:bg-gray-100'}`}>
                    Select {t.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8">
            <button onClick={() => role === "patient" ? setStep(1) : setStep(2)} className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-neuro-navy transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <div className="text-center">
              <h2 className="text-3xl font-heading font-black text-neuro-navy mb-2">Create your account</h2>
              <p className="text-gray-500">You're joining as a <span className="font-bold text-neuro-orange capitalize">{role === "patient" ? "Free Patient" : `${billingCycle} ${tier} ${role}`}</span>.</p>
            </div>

            <div className="space-y-3 mb-8">
              <button 
                onClick={() => signInWithProvider('google')}
                className="w-full py-4 px-6 border-2 border-gray-100 rounded-2xl flex items-center justify-center gap-3 text-sm font-bold text-neuro-navy hover:bg-gray-50 transition-all"
              >
                <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                Sign up with Google
              </button>
              <button 
                onClick={() => signInWithProvider('apple')}
                className="w-full py-4 px-6 bg-black text-white rounded-2xl flex items-center justify-center gap-3 text-sm font-bold hover:bg-gray-900 transition-all"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12.152 6.896c-.548 0-1.411-.516-1.411-1.354 0-.772.803-1.355 1.411-1.355.592 0 1.411.583 1.411 1.355 0 .838-.819 1.354-1.411 1.354zm2.322 7.654c0 2.01 1.736 2.7 1.762 2.713-.013.046-.274.945-.933 1.898-.565.827-1.152 1.651-2.082 1.668-.913.016-1.207-.535-2.25-.535-1.044 0-1.37.519-2.233.551-.897.031-1.565-.89-2.133-1.717-1.158-1.673-2.045-4.731-.853-6.792.592-1.023 1.645-1.668 2.776-1.684.864-.016 1.676.582 2.203.582.527 0 1.511-.733 2.543-.63.433.018 1.647.174 2.427 1.21-.061.037-1.452.845-1.452 2.518z"/></svg>
                Sign up with Apple
              </button>
            </div>

            <div className="relative flex items-center gap-4 mb-8">
              <div className="flex-1 h-px bg-gray-100"></div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Or create with email</span>
              <div className="flex-1 h-px bg-gray-100"></div>
            </div>

            {errorParam && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {decodeURIComponent(errorParam)}
              </div>
            )}

            <form 
              action={async (formData) => {
                setIsPending(true);
                await register(formData, role as string, tier as string, billingCycle);
                setIsPending(false);
              }} 
              className="space-y-4"
            >
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Full Name</label>
                <input name="name" type="text" required autoComplete="name" placeholder="John Doe" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20" value={formData.name} onChange={(e) => setBaseFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Email Address</label>
                <input name="email" type="email" required autoComplete="email" placeholder="john@example.com" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20" value={formData.email} onChange={(e) => setBaseFormData({...formData, email: e.target.value})} />
              </div>
              
              {role === "student" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">School</label>
                    <input name="school" type="text" placeholder="Life University" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20" value={formData.school} onChange={(e) => setBaseFormData({...formData, school: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Grad Year</label>
                    <input name="gradYear" type="text" placeholder="2027" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20" value={formData.gradYear} onChange={(e) => setBaseFormData({...formData, gradYear: e.target.value})} />
                  </div>
                </div>
              )}

              {role === "doctor" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Clinic Name</label>
                  <input name="clinicName" type="text" placeholder="Neuro-Life Wellness" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20" value={formData.clinicName} onChange={(e) => setBaseFormData({...formData, clinicName: e.target.value})} />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Password</label>
                <input name="password" type="password" required autoComplete="new-password" placeholder="••••••••" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20" value={formData.password} onChange={(e) => setBaseFormData({...formData, password: e.target.value})} />
              </div>

              <button 
                type="submit" 
                disabled={isPending}
                className="w-full py-5 bg-neuro-navy text-white font-black rounded-2xl hover:bg-neuro-navy-light transition-all shadow-xl shadow-neuro-navy/20 mt-6 uppercase tracking-widest disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Registration"}
              </button>
            </form>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">Already have an account? <Link href="/login" className="text-neuro-orange font-bold hover:underline">Log In</Link></p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neuro-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neuro-orange" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
