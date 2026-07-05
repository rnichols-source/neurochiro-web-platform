"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Check, MapPin, ShieldCheck, Loader2, Heart, Brain, Baby, Activity, Dumbbell, Frown } from "lucide-react";
import { findMatchingDoctors } from "./actions";

const CONCERNS = [
  { id: "pain", label: "Pain Relief", desc: "Back, neck, headaches, sciatica", icon: Activity },
  { id: "wellness", label: "Wellness & Prevention", desc: "Optimize health, prevent problems", icon: Heart },
  { id: "pediatric", label: "Pediatric / Family", desc: "Care for kids and families", icon: Baby },
  { id: "prenatal", label: "Prenatal / Pregnancy", desc: "Support during pregnancy", icon: Heart },
  { id: "stress", label: "Stress & Anxiety", desc: "Nervous system regulation", icon: Brain },
  { id: "sports", label: "Sports & Performance", desc: "Athletic recovery and performance", icon: Dumbbell },
];

const PRIORITIES = [
  { id: "close", label: "Close to home", desc: "Convenience matters most" },
  { id: "specialty", label: "Specializes in my concern", desc: "Expertise matters most" },
  { id: "reviews", label: "Great reviews & reputation", desc: "Trust matters most" },
  { id: "insurance", label: "Accepts my insurance", desc: "Cost matters most" },
];

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware",
  "Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky",
  "Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi",
  "Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico",
  "New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania",
  "Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont",
  "Virginia","Washington","West Virginia","Wisconsin","Wyoming",
];

export default function QuizPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [answers, setAnswers] = useState({
    concern: "",
    city: "",
    state: "",
    experience: "",
    priority: "",
    email: "",
  });

  const handleSubmit = async () => {
    if (!answers.email || !answers.email.includes("@")) return;
    setLoading(true);
    const docs = await findMatchingDoctors(answers);
    setResults(docs);
    setLoading(false);
  };

  // Step 0: Concern
  if (step === 0) {
    return (
      <div className="min-h-dvh bg-neuro-cream flex items-center justify-center px-6 py-12">
        <div className="max-w-lg w-full">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-heading font-black text-neuro-navy">Find Your Perfect Chiropractor</h1>
            <p className="text-gray-500 text-sm mt-2">Answer 4 quick questions. We'll match you with verified nervous system chiropractors near you.</p>
          </div>
          <p className="text-xs font-bold text-neuro-orange uppercase tracking-widest mb-4">What's your primary concern?</p>
          <div className="grid grid-cols-2 gap-3">
            {CONCERNS.map(c => (
              <button key={c.id} onClick={() => { setAnswers(a => ({ ...a, concern: c.id })); setStep(1); }}
                className="bg-white rounded-2xl border-2 border-gray-100 p-5 text-left hover:border-neuro-orange hover:shadow-md transition-all">
                <c.icon className="w-6 h-6 text-neuro-orange mb-2" />
                <div className="font-bold text-neuro-navy text-sm">{c.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{c.desc}</div>
              </button>
            ))}
          </div>
          <div className="text-center mt-6">
            <p className="text-[10px] text-gray-400">Powered by <Link href="/" className="text-neuro-orange font-bold">NeuroChiro</Link> — the nervous system chiropractic directory</p>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Location
  if (step === 1) {
    return (
      <div className="min-h-dvh bg-neuro-cream flex items-center justify-center px-6 py-12">
        <div className="max-w-lg w-full">
          <button onClick={() => setStep(0)} className="flex items-center gap-1 text-sm text-gray-400 mb-6 hover:text-neuro-orange"><ArrowLeft className="w-4 h-4" /> Back</button>
          <p className="text-xs font-bold text-neuro-orange uppercase tracking-widest mb-4">Where are you located?</p>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div>
              <label className="text-xs font-bold text-neuro-navy uppercase tracking-wider mb-1 block">City</label>
              <input value={answers.city} onChange={e => setAnswers(a => ({ ...a, city: e.target.value }))}
                placeholder="e.g., Austin" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange" />
            </div>
            <div>
              <label className="text-xs font-bold text-neuro-navy uppercase tracking-wider mb-1 block">State</label>
              <select value={answers.state} onChange={e => setAnswers(a => ({ ...a, state: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange">
                <option value="">Select state...</option>
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <button onClick={() => answers.state && setStep(2)} disabled={!answers.state}
            className="w-full mt-4 py-4 bg-neuro-orange text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-neuro-orange/90 transition-colors disabled:opacity-50">
            Next <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Experience
  if (step === 2) {
    return (
      <div className="min-h-dvh bg-neuro-cream flex items-center justify-center px-6 py-12">
        <div className="max-w-lg w-full">
          <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-gray-400 mb-6 hover:text-neuro-orange"><ArrowLeft className="w-4 h-4" /> Back</button>
          <p className="text-xs font-bold text-neuro-orange uppercase tracking-widest mb-4">Have you seen a chiropractor before?</p>
          <div className="space-y-3">
            {[
              { id: "yes", label: "Yes, I have", desc: "I've been to a chiropractor before" },
              { id: "nervous_system", label: "Yes, but not nervous system focused", desc: "I've seen a traditional chiropractor" },
              { id: "no", label: "No, this would be my first time", desc: "I'm new to chiropractic care" },
            ].map(opt => (
              <button key={opt.id} onClick={() => { setAnswers(a => ({ ...a, experience: opt.id })); setStep(3); }}
                className="w-full bg-white rounded-2xl border-2 border-gray-100 p-5 text-left hover:border-neuro-orange hover:shadow-md transition-all">
                <div className="font-bold text-neuro-navy text-sm">{opt.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Priority
  if (step === 3) {
    return (
      <div className="min-h-dvh bg-neuro-cream flex items-center justify-center px-6 py-12">
        <div className="max-w-lg w-full">
          <button onClick={() => setStep(2)} className="flex items-center gap-1 text-sm text-gray-400 mb-6 hover:text-neuro-orange"><ArrowLeft className="w-4 h-4" /> Back</button>
          <p className="text-xs font-bold text-neuro-orange uppercase tracking-widest mb-4">What's most important to you?</p>
          <div className="space-y-3">
            {PRIORITIES.map(p => (
              <button key={p.id} onClick={() => { setAnswers(a => ({ ...a, priority: p.id })); setStep(4); }}
                className="w-full bg-white rounded-2xl border-2 border-gray-100 p-5 text-left hover:border-neuro-orange hover:shadow-md transition-all">
                <div className="font-bold text-neuro-navy text-sm">{p.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Email capture
  if (step === 4 && !results) {
    return (
      <div className="min-h-dvh bg-neuro-cream flex items-center justify-center px-6 py-12">
        <div className="max-w-lg w-full">
          <button onClick={() => setStep(3)} className="flex items-center gap-1 text-sm text-gray-400 mb-6 hover:text-neuro-orange"><ArrowLeft className="w-4 h-4" /> Back</button>
          <p className="text-xs font-bold text-neuro-orange uppercase tracking-widest mb-4">Almost there! Enter your email to see your matches.</p>
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <label className="text-xs font-bold text-neuro-navy uppercase tracking-wider mb-1 block">Email Address</label>
            <input type="email" value={answers.email} onChange={e => setAnswers(a => ({ ...a, email: e.target.value }))}
              placeholder="you@email.com" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange" />
            <p className="text-[10px] text-gray-400 mt-2">We'll send you your results and notify you when new doctors join in your area. No spam. Unsubscribe anytime.</p>
          </div>
          <button onClick={handleSubmit} disabled={loading || !answers.email.includes("@")}
            className="w-full mt-4 py-4 bg-neuro-orange text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-neuro-orange/90 transition-colors disabled:opacity-50">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Finding your matches...</> : <>See My Matches <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      </div>
    );
  }

  // Results
  return (
    <div className="min-h-dvh bg-neuro-cream py-12 px-6">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-heading font-black text-neuro-navy">Your Matches</h1>
          <p className="text-gray-500 text-sm mt-2">
            {results && results.length > 0
              ? `Based on your answers, here are ${results.length} nervous system chiropractors near ${answers.city || answers.state}.`
              : `We're still growing our network in ${answers.city || answers.state}. Here are our top recommended doctors.`}
          </p>
        </div>

        {results && results.length > 0 ? (
          <div className="space-y-4 mb-8">
            {results.map((doc: any) => (
              <Link key={doc.id} href={`/directory/${doc.slug}`}>
                <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-neuro-orange/20 transition-all cursor-pointer flex gap-4 items-start mb-3">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex-shrink-0 overflow-hidden">
                    {doc.photo_url ? (
                      <img src={doc.photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl font-black">
                        {(doc.first_name?.[0] || "")}{(doc.last_name?.[0] || "")}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h2 className="font-bold text-neuro-navy">Dr. {doc.first_name} {doc.last_name}</h2>
                      <ShieldCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    </div>
                    {doc.clinic_name && <p className="text-xs text-gray-500">{doc.clinic_name}</p>}
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                      <MapPin className="w-3 h-3" /> {doc.city}, {doc.state}
                    </div>
                    {doc.specialties && doc.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {doc.specialties.slice(0, 3).map((s: string) => (
                          <span key={s} className="px-2 py-0.5 bg-neuro-orange/10 text-neuro-orange text-[9px] font-bold rounded-full uppercase">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 self-center">
                    <div className="px-3 py-1.5 bg-neuro-orange text-white text-xs font-bold rounded-lg">
                      View <ArrowRight className="w-3 h-3 inline" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center mb-8">
            <Frown className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No exact matches in your area yet. We're adding new doctors every week.</p>
            <Link href="/directory" className="inline-block mt-4 text-neuro-orange font-bold text-sm hover:underline">Browse Full Directory</Link>
          </div>
        )}

        <div className="text-center space-y-3">
          <Link href="/directory" className="inline-flex items-center gap-2 text-sm text-neuro-orange font-bold hover:underline">
            Browse Full Directory <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-[10px] text-gray-400">Results sent to {answers.email}. We'll notify you when new doctors join in your area.</p>
        </div>
      </div>
    </div>
  );
}
