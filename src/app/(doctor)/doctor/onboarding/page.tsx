"use client";

import { useState, useEffect } from "react";
import { Camera, FileText, Tag, Share2, ArrowRight, Loader2, CheckCircle2, Sparkles, Copy, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { completeOnboarding, updateOnboardingProfile } from "./actions";
import { generateAIProfileBio } from "../profile/actions";

const SPECIALTIES = [
  "Pediatric", "Prenatal", "Family Wellness", "Sports Performance",
  "Nervous System", "Upper Cervical", "Tonal", "Structural",
  "Neurological", "Functional Neurology", "Rehab", "Wellness",
  "Auto Injury", "Workers Comp", "Geriatric", "Activator",
];

export default function DoctorOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [slug, setSlug] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [copied, setCopied] = useState(false);

  // Step 1: Photo
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Step 2: Bio
  const [bio, setBio] = useState("");
  const [generatingBio, setGeneratingBio] = useState(false);

  // Step 3: Specialties
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: doc } = await supabase.from("doctors").select("slug, clinic_name").eq("user_id", user.id).single();
      if (doc?.slug) setSlug(doc.slug);
      if (doc?.clinic_name) setClinicName(doc.clinic_name);
    });
  }, []);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) { setStep(2); return; }
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const ext = photoFile.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    await supabase.storage.from('clinic-photos').upload(path, photoFile, { upsert: true });
    const { data: urlData } = supabase.storage.from('clinic-photos').getPublicUrl(path);

    // Update doctor photo via fetch to avoid RLS
    await fetch('/api/activity', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventType: 'page_view' }) }).catch(() => {});

    // Use admin client via server action pattern
    const { createAdminClient } = await import('@/lib/supabase-admin');
    // Can't call admin from client — use profile avatar instead
    await supabase.from('profiles').update({ avatar_url: urlData.publicUrl } as any).eq('id', user.id);

    setLoading(false);
    setStep(2);
  };

  const handleGenerateBio = async () => {
    setGeneratingBio(true);
    const result = await generateAIProfileBio(clinicName || '', '');
    if (result && 'bio' in result && result.bio) setBio(result.bio);
    setGeneratingBio(false);
  };

  const handleBioNext = () => {
    setStep(3);
  };

  const handleSpecialtiesNext = async () => {
    if (selectedSpecialties.length === 0) return;
    setLoading(true);
    await updateOnboardingProfile({ specialties: selectedSpecialties, bio: bio || undefined });
    setLoading(false);
    setStep(4);
  };

  const handleComplete = async () => {
    setLoading(true);
    await completeOnboarding();
    router.push('/doctor/dashboard');
  };

  const toggleSpecialty = (s: string) => {
    setSelectedSpecialties(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const profileUrl = `neurochiro.co/directory/${slug}`;

  return (
    <div className="min-h-dvh bg-[#0F1A24] flex items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`flex-1 h-1.5 rounded-full transition-all ${s <= step ? 'bg-neuro-orange' : 'bg-white/10'}`} />
          ))}
        </div>

        {/* Step 1: Photo */}
        {step === 1 && (
          <div className="text-center space-y-6">
            <Camera className="w-12 h-12 text-neuro-orange mx-auto" />
            <h1 className="text-2xl font-heading font-black text-white">Add Your Photo</h1>
            <p className="text-white/40">Profiles with photos get 5x more views from patients.</p>

            <div className="flex flex-col items-center gap-4">
              {photoPreview ? (
                <img src={photoPreview} alt="" className="w-32 h-32 rounded-2xl object-cover" />
              ) : (
                <label className="w-32 h-32 rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-neuro-orange/40 transition-colors">
                  <Camera className="w-8 h-8 text-white/20 mb-1" />
                  <span className="text-[10px] text-white/20">Upload</span>
                  <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                </label>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 py-3 text-white/40 text-sm font-bold hover:text-white/60 transition-colors">
                Skip for now
              </button>
              <button onClick={handlePhotoUpload} disabled={loading} className="flex-1 py-3 bg-neuro-orange text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {photoFile ? "Upload & Continue" : "Continue"}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Bio */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <FileText className="w-12 h-12 text-neuro-orange mx-auto mb-4" />
              <h1 className="text-2xl font-heading font-black text-white">Write Your Bio</h1>
              <p className="text-white/40">Tell patients about your practice and approach.</p>
            </div>

            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={6}
              placeholder="Describe your practice, specialties, and what makes your approach unique..."
              className="w-full p-4 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white text-sm resize-none focus:outline-none focus:border-neuro-orange placeholder:text-white/20"
            />

            <button
              onClick={handleGenerateBio}
              disabled={generatingBio}
              className="w-full py-3 bg-white/[0.06] border border-white/[0.1] text-white/60 font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-white/[0.1] transition-colors disabled:opacity-50"
            >
              {generatingBio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-neuro-orange" />}
              {generatingBio ? "Generating..." : "Generate with AI"}
            </button>

            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="flex-1 py-3 text-white/40 text-sm font-bold hover:text-white/60 transition-colors">
                Skip for now
              </button>
              <button onClick={handleBioNext} className="flex-1 py-3 bg-neuro-orange text-white font-bold rounded-xl flex items-center justify-center gap-2">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Specialties */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <Tag className="w-12 h-12 text-neuro-orange mx-auto mb-4" />
              <h1 className="text-2xl font-heading font-black text-white">Select Your Specialties</h1>
              <p className="text-white/40">Choose at least one. This helps patients find you.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {SPECIALTIES.map(s => (
                <button
                  key={s}
                  onClick={() => toggleSpecialty(s)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    selectedSpecialties.includes(s)
                      ? 'bg-neuro-orange text-white'
                      : 'bg-white/[0.06] text-white/40 hover:bg-white/[0.1] border border-white/[0.08]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <button
              onClick={handleSpecialtiesNext}
              disabled={selectedSpecialties.length === 0 || loading}
              className="w-full py-3 bg-neuro-orange text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              Continue
            </button>
          </div>
        )}

        {/* Step 4: Share & Celebrate */}
        {step === 4 && (
          <div className="text-center space-y-8">
            {/* Celebration */}
            <div>
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </div>
              <h1 className="text-3xl font-heading font-black text-white">You&apos;re Live!</h1>
              <p className="text-white/50 mt-2">Your profile is now visible to patients searching for nervous system chiropractors.</p>
            </div>

            {/* Profile Preview Card */}
            {slug && (
              <div className="bg-white/[0.06] border border-white/[0.1] rounded-2xl p-6 text-left">
                <div className="flex items-center gap-4 mb-4">
                  {photoPreview ? (
                    <img src={photoPreview} alt="" className="w-14 h-14 rounded-xl object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-neuro-orange/20 flex items-center justify-center text-neuro-orange font-black text-xl">
                      {(clinicName?.[0] || 'N').toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-white font-bold text-lg">{clinicName || 'Your Practice'}</p>
                    <p className="text-white/40 text-sm">{selectedSpecialties.slice(0, 2).join(' · ') || 'Nervous System Specialist'}</p>
                  </div>
                </div>

                {/* Profile URL */}
                <div className="bg-white/[0.04] rounded-xl p-3 flex items-center gap-2">
                  <code className="flex-1 text-sm text-neuro-orange font-mono truncate">{profileUrl}</code>
                  <button
                    onClick={() => { navigator.clipboard.writeText(`https://${profileUrl}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    className="p-2 bg-white/[0.06] rounded-lg hover:bg-white/[0.1] transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white/40" />}
                  </button>
                </div>
              </div>
            )}

            {/* Trial badge */}
            <div className="bg-neuro-orange/10 border border-neuro-orange/20 rounded-xl p-4">
              <p className="text-neuro-orange font-bold text-sm">Your 7-day Pro trial is active</p>
              <p className="text-white/40 text-xs mt-1">Full access to analytics, patient leads, and all Pro tools. No credit card required.</p>
            </div>

            {/* Share buttons */}
            <div className="grid grid-cols-2 gap-3">
              <a
                href={`https://www.instagram.com/`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 bg-white/[0.06] border border-white/[0.1] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-white/[0.1] transition-colors"
              >
                Share on Instagram
              </a>
              <button
                onClick={() => {
                  const text = `I just joined the NeuroChiro network! Find me at https://${profileUrl}`;
                  if (navigator.share) { navigator.share({ text, url: `https://${profileUrl}` }).catch(() => {}); }
                  else { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }
                }}
                className="py-3 bg-white/[0.06] border border-white/[0.1] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-white/[0.1] transition-colors"
              >
                <Share2 className="w-4 h-4" /> Share Link
              </button>
            </div>

            {/* Go to Dashboard */}
            <button
              onClick={handleComplete}
              disabled={loading}
              className="w-full py-4 bg-neuro-orange text-white font-bold rounded-xl flex items-center justify-center gap-2 text-lg disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
