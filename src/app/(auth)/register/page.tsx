"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  AlertCircle,
  Lock,
  Mail,
  MapPin,
  Globe,
  Stethoscope,
  ChevronRight,
  Info
} from "lucide-react";
import { createAccountAction, updateProfileAction, signInWithProvider } from "../actions/auth";
import { STRIPE_PAYMENT_LINKS } from "@/lib/stripe-links";
import { createClient } from "@/lib/supabase";

type Role = "student" | "doctor" | "patient" | "vendor";
type Step = "account" | "profile" | "payment";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { region } = useRegion();

  // Params from pricing page
  const initialRole = (searchParams.get("role") as Role) || "doctor";
  const initialTier = searchParams.get("tier") || "starter";
  const initialBilling = (searchParams.get("billing") as "monthly" | "annual") || "monthly";

  const [step, setStep] = useState<Step>("account");
  const [userId, setUserId] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (initialRole === 'patient') {
           router.push('/portal/dashboard');
           return;
        }
        setUserId(user.id);
        // If logged in, skip Step 1 but stay on Step 2 (Profile)
        setStep("profile");
      }
    };
    checkUser();
  }, [initialRole, router]);

  // Restore session if available
  useEffect(() => {
    const draft = localStorage.getItem('nc_registration_draft');
    if (draft) {
      const parsed = JSON.parse(draft);
      if (parsed.userId && parsed.role === initialRole && parsed.tier === initialTier) {
        setUserId(parsed.userId);
        setStep(parsed.step as Step);
      }
    }
  }, [initialRole, initialTier]);

  // Form States
  const [accountData, setAccountData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    acceptedTerms: false,
  });

  const [profileData, setProfileData] = useState({
    clinicName: "",
    companyName: "",
    website: "",
    city: "",
    specialty: "",
    school: "",
    gradYear: "",
  });

  const steps = [
    { id: "account", label: "Create Account", icon: User },
    { id: "profile", label: "Profile Setup", icon: Stethoscope },
    { id: "payment", label: "Payment", icon: ShieldCheck },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === step);

  // --- Step 1: Create Account ---
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accountData.acceptedTerms) {
      setError("You must accept the Terms of Service and Privacy Policy.");
      return;
    }

    setIsPending(true);
    setError(null);

    const formData = new FormData();
    formData.append("name", accountData.name);
    formData.append("email", accountData.email);
    formData.append("password", accountData.password);
    formData.append("phone", accountData.phone);

    const result = await createAccountAction(formData, initialRole, initialTier, initialBilling);

    if (result.error) {
      setError(result.error);
      setIsPending(false);
    } else {
      // Result success, user established
      if (initialRole === 'patient') {
        router.push(`/portal/dashboard?welcome=true`);
        return;
      }

      setUserId(result.user.id);
      setStep("profile");
      setIsPending(false);
      // Optional: Store draft progress in local storage
      localStorage.setItem('nc_registration_draft', JSON.stringify({
        userId: result.user.id,
        role: initialRole,
        tier: initialTier,
        billing: initialBilling,
        step: "profile",
        email: accountData.email
      }));
    }
  };

  // --- Step 2: Setup Profile ---
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const result = await updateProfileAction(userId!, {
      ...profileData,
      role: initialRole,
      tier: initialTier,
    });

    if (result.error) {
      setError(result.error);
      setIsPending(false);
    } else {
      // 🛡️ LEGACY CLAIM BYPASS: 
      // If they are claiming an existing profile, they have already paid.
      // Skip the payment step and go straight to dashboard.
      const isClaiming = !!searchParams.get("claim_id");

      if (isClaiming) {
        localStorage.removeItem('nc_registration_draft');
        router.push(`/${initialRole}/dashboard?claim_success=true`);
      } else {
        setStep("payment");
      }
      setIsPending(false);
    }
  };
    
    // Update local storage
    const draft = localStorage.getItem('nc_registration_draft');
    if (draft) {
      const parsed = JSON.parse(draft);
      localStorage.setItem('nc_registration_draft', JSON.stringify({ ...parsed, step: "payment" }));
    }
  };

  // --- Step 3: Redirect to Stripe ---
  const handleFinalizePayment = () => {
    setIsPending(true);
    
    // For free tiers, go straight to success
    if (initialTier === "free") {
      router.push(`/payment-success?role=${initialRole}&tier=${initialTier}`);
      return;
    }

    // Get the correct Stripe link
    const links = initialRole === "doctor" ? STRIPE_PAYMENT_LINKS.doctor : STRIPE_PAYMENT_LINKS.student;
    const baseUrl = (links as any)[initialTier][initialBilling];
    
    // CRITICAL: Append user_id to stripe metadata via client_reference_id
    // This allows the webhook to identify the user and activate their profile.
    const stripeUrl = `${baseUrl}?client_reference_id=${userId}&prefilled_email=${encodeURIComponent(accountData.email || "")}`;
    
    window.location.href = stripeUrl;
  };

  return (
    <div className="min-h-screen bg-neuro-cream flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-neuro-orange/5 blur-[160px] -mr-40 -mt-40 rounded-full animate-pulse-slow"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-neuro-navy/5 blur-[140px] -ml-32 -mb-32 rounded-full"></div>

      <div className="w-full max-w-2xl bg-white rounded-[4rem] shadow-[0_48px_96px_-16px_rgba(0,0,0,0.12)] border border-white/40 backdrop-blur-sm p-8 md:p-16 relative z-10">
        
        {/* Progress Navigation */}
        <div className="flex items-center justify-between mb-16 relative px-4">
          <div className="absolute left-10 right-10 top-5 h-0.5 bg-gray-100 -z-10"></div>
          <div 
            className="absolute left-10 top-5 h-0.5 bg-neuro-orange transition-all duration-700 ease-in-out -z-10"
            style={{ width: `${(currentStepIndex / (steps.length - 1)) * (steps.length > 1 ? 84 : 0)}%` }}
          ></div>
          
          {steps.map((s, i) => (
            <div key={s.id} className="flex flex-col items-center gap-3 relative">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 bg-white ${
                currentStepIndex >= i ? "border-neuro-orange text-neuro-orange shadow-[0_0_20px_rgba(214,104,41,0.2)]" : "border-gray-100 text-gray-300"
              }`}>
                {currentStepIndex > i ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <CheckCircle2 className="w-6 h-6 fill-neuro-orange text-white" />
                  </motion.div>
                ) : <s.icon className="w-5 h-5" />}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap ${currentStepIndex >= i ? "text-neuro-navy" : "text-gray-300"}`}>
                Step {i + 1} of 3: {s.label}
              </span>
            </div>
          ))}
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 p-5 bg-red-50 border border-red-100 rounded-[2rem] flex items-center gap-4 text-red-600 text-sm font-bold"
          >
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-red-500 shadow-sm">
              <AlertCircle className="w-4 h-4" />
            </div>
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 1: ACCOUNT CREATION */}
          {step === "account" && (
            <motion.div
              key="account"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.5 }}
              className="space-y-10"
            >
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-neuro-orange/10 rounded-full mb-6">
                  <Sparkles className="w-4 h-4 text-neuro-orange fill-current" />
                  <span className="text-[10px] font-black text-neuro-orange uppercase tracking-widest">Step 1: Identity</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-heading font-black text-neuro-navy mb-4 tracking-tight leading-tight">Create Your Account</h1>
                <p className="text-gray-500 text-lg font-medium">First, let's establish your NeuroChiro credentials.</p>
              </div>

              <div className="space-y-4">
                <button 
                  type="button"
                  onClick={() => signInWithProvider('google')}
                  className="w-full py-4 px-6 border-2 border-gray-100 rounded-[2rem] flex items-center justify-center gap-3 text-sm font-bold text-neuro-navy hover:bg-gray-50 transition-all hover:border-neuro-navy/20"
                >
                  <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                  Continue with Google
                </button>
              </div>

              <div className="relative flex items-center gap-6">
                <div className="flex-1 h-px bg-gray-100"></div>
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Or use email</span>
                <div className="flex-1 h-px bg-gray-100"></div>
              </div>

              <form onSubmit={handleCreateAccount} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-neuro-orange transition-colors" />
                    <input 
                      type="text" required placeholder="Dr. Raymond Nichols"
                      className="w-full pl-16 pr-8 py-5 bg-gray-50 border border-gray-100 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-neuro-orange/10 focus:border-neuro-orange/30 transition-all font-medium"
                      value={accountData.name}
                      onChange={(e) => setAccountData({...accountData, name: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-neuro-orange transition-colors" />
                      <input 
                        type="email" required placeholder="raymond@neurochiro.co"
                        className="w-full pl-16 pr-8 py-5 bg-gray-50 border border-gray-100 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-neuro-orange/10 focus:border-neuro-orange/30 transition-all font-medium"
                        value={accountData.email}
                        onChange={(e) => setAccountData({...accountData, email: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Phone Number</label>
                    <div className="relative group">
                      <Zap className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-neuro-orange transition-colors" />
                      <input 
                        type="tel" required placeholder="(555) 000-0000"
                        className="w-full pl-16 pr-8 py-5 bg-gray-50 border border-gray-100 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-neuro-orange/10 focus:border-neuro-orange/30 transition-all font-medium"
                        value={accountData.phone}
                        onChange={(e) => setAccountData({...accountData, phone: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Create Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-neuro-orange transition-colors" />
                    <input 
                      type="password" required placeholder="••••••••"
                      className="w-full pl-16 pr-8 py-5 bg-gray-50 border border-gray-100 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-neuro-orange/10 focus:border-neuro-orange/30 transition-all font-medium"
                      value={accountData.password}
                      onChange={(e) => setAccountData({...accountData, password: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <input 
                    type="checkbox" required id="terms"
                    className="mt-1.5 w-5 h-5 rounded border-gray-300 text-neuro-orange focus:ring-neuro-orange transition-all cursor-pointer"
                    checked={accountData.acceptedTerms}
                    onChange={(e) => setAccountData({...accountData, acceptedTerms: e.target.checked})}
                  />
                  <label htmlFor="terms" className="text-xs font-medium text-gray-500 leading-relaxed cursor-pointer">
                    I agree to the <Link href="/terms" className="text-neuro-navy font-bold hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-neuro-navy font-bold hover:underline">Privacy Policy</Link>. I understand that I can cancel my subscription at any time.
                  </label>
                </div>

                <button 
                  type="submit" disabled={isPending}
                  className="w-full py-6 bg-neuro-navy text-white font-black rounded-[2rem] hover:bg-neuro-navy-light transition-all shadow-2xl shadow-neuro-navy/20 mt-8 uppercase tracking-[0.2em] text-sm disabled:opacity-70 flex items-center justify-center gap-3 group"
                >
                  {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      Establish Account
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* STEP 2: PROFILE SETUP */}
          {step === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-10"
            >
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-neuro-orange/10 rounded-full mb-6">
                  <Stethoscope className="w-4 h-4 text-neuro-orange fill-current" />
                  <span className="text-[10px] font-black text-neuro-orange uppercase tracking-widest">Step 2: Profile</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-heading font-black text-neuro-navy mb-4 tracking-tight leading-tight">Tell us about yourself</h2>
                <p className="text-gray-500 text-lg font-medium">This helps us customize your {initialRole} experience.</p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                {initialRole === "doctor" ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Clinic Name</label>
                      <div className="relative group">
                        <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-neuro-orange transition-colors" />
                        <input 
                          type="text" required placeholder="Neuro-Life Wellness"
                          className="w-full pl-16 pr-8 py-5 bg-gray-50 border border-gray-100 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-neuro-orange/10 focus:border-neuro-orange/30 transition-all font-medium"
                          value={profileData.clinicName}
                          onChange={(e) => setProfileData({...profileData, clinicName: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">City</label>
                        <div className="relative group">
                          <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-neuro-orange transition-colors" />
                          <input 
                            type="text" required placeholder="Austin"
                            className="w-full pl-16 pr-8 py-5 bg-gray-50 border border-gray-100 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-neuro-orange/10 focus:border-neuro-orange/30 transition-all font-medium"
                            value={profileData.city}
                            onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Website</label>
                        <div className="relative group">
                          <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-neuro-orange transition-colors" />
                          <input 
                            type="text" placeholder="https://..."
                            className="w-full pl-16 pr-8 py-5 bg-gray-50 border border-gray-100 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-neuro-orange/10 focus:border-neuro-orange/30 transition-all font-medium"
                            value={profileData.website}
                            onChange={(e) => setProfileData({...profileData, website: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                ) : initialRole === "vendor" ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Company Name</label>
                      <div className="relative group">
                        <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-neuro-orange transition-colors" />
                        <input 
                          type="text" required placeholder="Acme Chiropractic Supplies"
                          className="w-full pl-16 pr-8 py-5 bg-gray-50 border border-gray-100 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-neuro-orange/10 focus:border-neuro-orange/30 transition-all font-medium"
                          value={profileData.companyName}
                          onChange={(e) => setProfileData({...profileData, companyName: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">HQ City</label>
                        <div className="relative group">
                          <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-neuro-orange transition-colors" />
                          <input 
                            type="text" required placeholder="Chicago"
                            className="w-full pl-16 pr-8 py-5 bg-gray-50 border border-gray-100 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-neuro-orange/10 focus:border-neuro-orange/30 transition-all font-medium"
                            value={profileData.city}
                            onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Website</label>
                        <div className="relative group">
                          <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-neuro-orange transition-colors" />
                          <input 
                            type="text" required placeholder="https://..."
                            className="w-full pl-16 pr-8 py-5 bg-gray-50 border border-gray-100 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-neuro-orange/10 focus:border-neuro-orange/30 transition-all font-medium"
                            value={profileData.website}
                            onChange={(e) => setProfileData({...profileData, website: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Chiropractic School</label>
                      <div className="relative group">
                        <GraduationCap className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-neuro-orange transition-colors" />
                        <input 
                          type="text" required placeholder="Life University"
                          className="w-full pl-16 pr-8 py-5 bg-gray-50 border border-gray-100 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-neuro-orange/10 focus:border-neuro-orange/30 transition-all font-medium"
                          value={profileData.school}
                          onChange={(e) => setProfileData({...profileData, school: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Expected Graduation Year</label>
                      <input 
                        type="text" required placeholder="2027"
                        className="w-full px-8 py-5 bg-gray-50 border border-gray-100 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-neuro-orange/10 focus:border-neuro-orange/30 transition-all font-medium"
                        value={profileData.gradYear}
                        onChange={(e) => setProfileData({...profileData, gradYear: e.target.value})}
                      />
                    </div>
                  </>
                )}

                <button 
                  type="submit" disabled={isPending}
                  className="w-full py-6 bg-neuro-navy text-white font-black rounded-[2rem] hover:bg-neuro-navy-light transition-all shadow-2xl shadow-neuro-navy/20 mt-8 uppercase tracking-[0.2em] text-sm disabled:opacity-70 flex items-center justify-center gap-3 group"
                >
                  {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      Save & Continue
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* STEP 3: PAYMENT CONFIRMATION */}
          {step === "payment" && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-10"
            >
              <div className="text-center">
                <div className="w-24 h-24 bg-neuro-orange/10 rounded-[2.5rem] flex items-center justify-center text-neuro-orange mx-auto mb-8 shadow-inner">
                  <Sparkles className="w-12 h-12 fill-current" />
                </div>
                <h2 className="text-4xl md:text-5xl font-heading font-black text-neuro-navy mb-4 tracking-tight leading-tight">Secure Your Spot</h2>
                <p className="text-gray-500 text-lg font-medium">Join the elite network of neuro-focused leaders.</p>
              </div>

              <div className="bg-gray-50 rounded-[3rem] p-10 border border-gray-100 shadow-inner">
                <div className="flex justify-between items-start mb-8 pb-8 border-b border-gray-200">
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Selected Membership</span>
                    <h4 className="text-3xl font-black text-neuro-navy capitalize">{initialTier} {initialRole}</h4>
                    <div className="flex items-center gap-2 mt-2">
                       <ShieldCheck className="w-4 h-4 text-emerald-500" />
                       <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Verified Program</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">{initialBilling} billing</span>
                    <p className="text-4xl font-black text-neuro-orange">
                      {region.currency.symbol}{initialRole === "doctor" 
                        ? (region.pricing.doctor as any)[initialTier][initialBilling] 
                        : (region.pricing.student as any)[initialTier][initialBilling]
                      }
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    "Instant access to clinical playbooks",
                    "Global directory verified placement",
                    "Priority seminar visibility",
                    "Cancel or upgrade at any time"
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-4 text-sm font-bold text-neuro-navy/70">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 flex-shrink-0">
                        <Check className="w-3 h-3" strokeWidth={4} />
                      </div>
                      {text}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <button 
                  onClick={handleFinalizePayment}
                  disabled={isPending}
                  className="w-full py-7 bg-neuro-orange text-white font-black rounded-[2rem] hover:bg-neuro-orange-dark transition-all shadow-[0_20px_40px_rgba(214,104,41,0.3)] uppercase tracking-[0.25em] text-sm flex items-center justify-center gap-4 transform hover:-translate-y-1"
                >
                  {isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                    <>
                      <Lock className="w-5 h-5" />
                      Proceed to Secure Payment
                    </>
                  )}
                </button>
                <div className="flex flex-col items-center gap-4">
                   <div className="flex items-center gap-2 text-gray-400">
                      <Info className="w-4 h-4" />
                      <p className="text-[10px] font-black uppercase tracking-widest">
                        Redirecting to Stripe for secure checkout
                      </p>
                   </div>
                   <div className="flex gap-4 opacity-30 grayscale">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-5" />
                   </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 text-center pt-8 border-t border-gray-50">
          <p className="text-sm text-gray-400 font-medium">
            Already have an account? <Link href={`/login?redirect=/register&role=${initialRole}&tier=${initialTier}&billing=${initialBilling}`} className="text-neuro-orange font-black hover:underline ml-1">Log In & Continue</Link>
          </p>
        </div>
      </div>
      
      {/* Testimonial Quote */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-12 max-w-lg text-center"
      >
        <p className="text-gray-400 italic text-sm">"Joining NeuroChiro was the single best decision for my practice growth this year. The network is unmatched."</p>
        <p className="text-[10px] font-black uppercase tracking-widest text-neuro-navy mt-2">— Dr. Sarah Chen, Life Chiropractic</p>
      </motion.div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neuro-cream flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-neuro-orange mb-4" />
        <p className="text-[10px] font-black text-neuro-navy uppercase tracking-[0.3em]">Initializing Core...</p>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
