"use client";

import { Camera, Loader2, Sparkles, Save, ExternalLink, Plus, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { getDoctorProfile, updateDoctorProfile, uploadAvatar, generateAIProfileBio, uploadGalleryImage, uploadBannerImage, uploadTeamPhoto } from "./actions";
import VerifiedBadge from "@/components/doctor/VerifiedBadge";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [showToast, setShowToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: "", type: 'success' });
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Dynamic list state
  const [faqItems, setFaqItems] = useState<{question: string; answer: string}[]>([]);
  const [teamMembers, setTeamMembers] = useState<{name: string; role: string; photo_url: string}[]>([]);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [amenitiesSelected, setAmenitiesSelected] = useState<string[]>([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Warn on tab close if unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) { e.preventDefault(); }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const [error, setError] = useState(false);

  useEffect(() => {
    getDoctorProfile()
      .then((data) => {
        setProfile(data);
        setFaqItems(data?.faq || []);
        setTeamMembers(data?.team_members || []);
        setGalleryUrls(data?.gallery_images || []);
        setAmenitiesSelected(data?.amenities || []);
      })
      .catch(() => { setError(true); })
      .finally(() => setLoading(false));
  }, []);

  const toast = (message: string, type: 'success' | 'error' = 'success') => {
    setShowToast({ show: true, message, type });
    setTimeout(() => setShowToast({ show: false, message: "", type: 'success' }), 3000);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const result = await updateDoctorProfile(new FormData(e.currentTarget));
    setSaving(false);
    if (result.success) setHasUnsavedChanges(false);
    toast(result.success ? "Profile saved." : (result.error || "Failed to save."), result.success ? 'success' : 'error');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast("Image too large. Please use a photo under 5MB.", "error");
      return;
    }

    // Compress image client-side before uploading
    let uploadFile = file;
    if (file.size > 1 * 1024 * 1024) {
      try {
        uploadFile = await compressImage(file, 800, 0.8);
      } catch {
        // If compression fails, use original
      }
    }

    setSaving(true);
    const formData = new FormData();
    formData.append("file", uploadFile);
    const result = await uploadAvatar(formData);
    setSaving(false);
    if (result.success) {
      setProfile((p: any) => ({ ...p, photo_url: result.publicUrl }));
      toast("Photo updated.");
    } else toast(result.error || "Upload failed.", "error");
  };

  // Client-side image compression
  const compressImage = (file: File, maxWidth: number, quality: number): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('No canvas context')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error('Compression failed')); return; }
          resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        }, 'image/jpeg', quality);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleGenerateBio = async () => {
    setIsGeneratingBio(true);
    const result = await generateAIProfileBio(profile?.clinic_name || '', profile?.bio || '');
    setIsGeneratingBio(false);
    if (result.success && result.bio) {
      setProfile((p: any) => ({ ...p, bio: result.bio }));
      toast("Bio generated. Review and save.");
    } else toast(result.error || "Failed to generate bio.", "error");
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    let uploadFile = file;
    if (file.size > 1 * 1024 * 1024) {
      try { uploadFile = await compressImage(file, 1400, 0.85); } catch {}
    }
    const fd = new FormData(); fd.append('file', uploadFile);
    const result = await uploadBannerImage(fd);
    setUploadingBanner(false);
    if (result.success) { setProfile((p: any) => ({ ...p, banner_url: result.publicUrl })); toast("Banner updated."); }
    else toast(result.error || "Upload failed.", "error");
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingGallery(true);
    for (let i = 0; i < Math.min(files.length, 10 - galleryUrls.length); i++) {
      let uploadFile = files[i];
      if (uploadFile.size > 1 * 1024 * 1024) {
        try { uploadFile = await compressImage(uploadFile, 1000, 0.8); } catch {}
      }
      const fd = new FormData(); fd.append('file', uploadFile);
      const result = await uploadGalleryImage(fd);
      if (result.success && result.publicUrl) setGalleryUrls(prev => [...prev, result.publicUrl!]);
    }
    setUploadingGallery(false);
    setHasUnsavedChanges(true);
    toast("Photos added. Save to keep them.");
  };

  const AMENITY_OPTIONS = ["Kid-Friendly", "Wheelchair Accessible", "Open Adjusting", "Private Rooms", "Digital X-Ray", "On-Site Parking", "Prenatal Room", "Same-Day Appointments", "Baby Changing Station", "Play Area"];

  if (loading) return <div className="flex items-center justify-center min-h-dvh"><Loader2 className="w-8 h-8 text-neuro-orange animate-spin" /></div>;
  if (error) return <div className="flex flex-col items-center justify-center min-h-dvh gap-4"><p className="text-red-500 font-bold">Failed to load profile.</p><button onClick={() => window.location.reload()} className="px-4 py-2 bg-neuro-navy text-white rounded-xl text-sm font-bold">Retry</button></div>;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto pb-20">
      {/* Toast */}
      {showToast.show && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-bold shadow-lg ${showToast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {showToast.message}
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-heading font-black text-neuro-navy">Profile</h1>
        {profile?.slug && (
          <Link href={`/directory/${profile.slug}`} target="_blank" className="text-sm font-bold text-neuro-orange flex items-center gap-1 hover:underline">
            View Public Profile <ExternalLink className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Profile Live Status */}
      {profile?.verification_status === 'verified' && profile?.slug && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <p className="text-sm font-bold text-green-700">Your profile is live in the directory</p>
          </div>
          <Link href={`/directory/${profile.slug}`} target="_blank" className="text-xs font-bold text-green-600 hover:underline">View it</Link>
        </div>
      )}
      {profile?.verification_status === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <p className="text-sm font-bold text-yellow-700">Your profile is under review.</p>
          <p className="text-xs text-yellow-600 mt-1">Most profiles are reviewed within 24-48 hours. You&apos;ll get a notification when it goes live.</p>
        </div>
      )}

      <form onSubmit={handleSave} onChange={() => setHasUnsavedChanges(true)} className="space-y-8">
        {/* Photo */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">Photo</h2>
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 rounded-2xl bg-gray-100 overflow-hidden border-2 border-gray-50">
              {profile?.photo_url ? (
                <Image src={profile.photo_url} alt="Profile" fill className="object-cover" sizes="96px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300"><Camera className="w-8 h-8" /></div>
              )}
            </div>
            <div>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-neuro-navy text-white rounded-xl text-sm font-bold hover:bg-neuro-navy/90">
                Upload Photo
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              <p className="text-xs text-gray-400 mt-1">JPG, PNG. Max 5MB.</p>
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">Personal Info</h2>
          <input name="full_name" defaultValue={profile?.full_name || ''} placeholder="Full Name" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange mb-4" />
        </div>

        {/* Clinic Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">Clinic Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="clinic_name" defaultValue={profile?.clinic_name || ''} placeholder="Clinic Name" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange" />
            <input name="phone" defaultValue={profile?.phone || ''} placeholder="Clinic phone number" inputMode="tel" autoComplete="tel" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange" />
            <input name="address" defaultValue={profile?.address || ''} placeholder="Street Address" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange md:col-span-2" />
            <input name="city" defaultValue={profile?.city || ''} placeholder="City" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange" />
            <input name="state" defaultValue={profile?.state || ''} placeholder="State / Province" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange" />
            <input name="zip_code" defaultValue={profile?.zip_code || ''} placeholder="ZIP / Postal Code" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange" />
            <input name="country" defaultValue={profile?.country || ''} placeholder="Country" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange" />
          </div>
        </div>

        {/* Online Presence */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">Online Presence</h2>
          <div className="space-y-4">
            <input name="website" defaultValue={profile?.website_url || ''} placeholder="Website URL" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="instagram_url" defaultValue={profile?.instagram_url || ''} placeholder="Instagram URL" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange" />
              <input name="facebook_url" defaultValue={profile?.facebook_url || ''} placeholder="Facebook URL" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange" />
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide">Bio</h2>
            <button type="button" onClick={handleGenerateBio} disabled={isGeneratingBio} className="flex items-center gap-1 px-3 py-1.5 bg-neuro-orange/10 text-neuro-orange rounded-lg text-xs font-bold hover:bg-neuro-orange/20 disabled:opacity-50">
              <Sparkles className="w-3 h-3" /> {isGeneratingBio ? 'Generating...' : 'AI Generate'}
            </button>
          </div>
          <textarea name="bio" defaultValue={profile?.bio || ''} value={profile?.bio || ''} onChange={(e) => setProfile((p: any) => ({...p, bio: e.target.value}))} placeholder="Tell patients about your practice and approach..." rows={5} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange resize-none" />
        </div>

        {/* Specialties */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">Specialties</h2>
          <input name="specialties" defaultValue={(profile?.specialties || []).join(', ')} placeholder="e.g. Neurological, Pediatrics, Sports Performance (comma separated)" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange" />
        </div>

        {/* Video URL */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">Video URL</h2>
          <input name="video_url" defaultValue={profile?.video_url || ''} placeholder="YouTube or Vimeo link" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange" />
        </div>

        {/* Booking & Availability */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">Booking & Availability</h2>
          <input name="booking_url" defaultValue={profile?.booking_url || ''} placeholder="Online booking URL (Jane, ChiroTouch, Fresha, etc.)" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
              <input type="checkbox" name="accepting_new_patients" value="true" defaultChecked={profile?.accepting_new_patients !== false} className="w-4 h-4 accent-neuro-orange" />
              <span className="text-sm font-medium text-gray-700">Accepting New Patients</span>
            </label>
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
              <input type="checkbox" name="offers_telehealth" value="true" defaultChecked={profile?.offers_telehealth === true} className="w-4 h-4 accent-neuro-orange" />
              <span className="text-sm font-medium text-gray-700">Telehealth Available</span>
            </label>
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
              <input type="checkbox" name="accepts_walkins" value="true" defaultChecked={profile?.accepts_walkins === true} className="w-4 h-4 accent-neuro-orange" />
              <span className="text-sm font-medium text-gray-700">Walk-Ins Welcome</span>
            </label>
          </div>
        </div>

        {/* Practice Details */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">Practice Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Years in Practice</label>
              <input name="years_in_practice" type="number" defaultValue={profile?.years_in_practice || ''} placeholder="e.g. 12" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Google Place ID (for reviews)</label>
              <input name="google_place_id" defaultValue={profile?.google_place_id || ''} placeholder="e.g. ChIJ..." className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-bold text-gray-500 mb-1">Certifications (one per line)</label>
            <textarea name="certifications" defaultValue={(profile?.certifications || []).join('\n')} placeholder={"Webster Certified\nICPA Member\nPX Docs Trained"} rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange resize-none" />
          </div>
        </div>

        {/* Why Choose Me */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">Why Choose Me (Highlights)</h2>
          <textarea name="highlights" defaultValue={(profile?.highlights || []).join('\n')} placeholder={"Board Certified\n15+ Years Experience\nFamily-Friendly Office\n(one per line)"} rows={4} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange resize-none" />
        </div>

        {/* Patients We Help */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">Patients We Help</h2>
          <input name="conditions_treated" defaultValue={(profile?.conditions_treated || []).join(', ')} placeholder="Back Pain, Neck Pain, Pediatric, Prenatal, Sports Injuries (comma separated)" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange" />
        </div>

        {/* Education */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">Education</h2>
          <textarea name="education" defaultValue={(profile?.education || []).join('\n')} placeholder={"D.C. — Palmer College of Chiropractic, 2015\nB.S. Biology — State University, 2011\n(one per line)"} rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange resize-none" />
        </div>

        {/* Hours */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">Office Hours</h2>
          <textarea name="hours" defaultValue={profile?.hours || ''} placeholder={"Monday: 9:00 AM – 6:00 PM\nTuesday: 9:00 AM – 6:00 PM\nWednesday: Closed\n..."} rows={4} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange resize-none" />
        </div>

        {/* Languages */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">Languages</h2>
          <input name="languages" defaultValue={(profile?.languages || []).join(', ')} placeholder="English, Spanish (comma separated)" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange" />
        </div>

        {/* Payment & Insurance */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">Payment & Insurance</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Accepted Payment Methods</label>
              <input name="accepted_payment" defaultValue={(profile?.accepted_payment || []).join(', ')} placeholder="Cash, Credit Card, HSA, Insurance (comma separated)" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Insurance Networks</label>
              <input name="insurance_networks" defaultValue={(profile?.insurance_networks || []).join(', ')} placeholder="Blue Cross, Aetna, United, Cigna (comma separated)" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange" />
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">Amenities</h2>
          <input type="hidden" name="amenities" value={amenitiesSelected.join(',')} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {AMENITY_OPTIONS.map(a => (
              <label key={a} className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer border transition-colors ${amenitiesSelected.includes(a) ? 'bg-neuro-orange/10 border-neuro-orange/30 text-neuro-orange' : 'bg-gray-50 border-gray-100 text-gray-600'}`}>
                <input type="checkbox" checked={amenitiesSelected.includes(a)} onChange={(e) => { if (e.target.checked) setAmenitiesSelected(prev => [...prev, a]); else setAmenitiesSelected(prev => prev.filter(x => x !== a)); setHasUnsavedChanges(true); }} className="sr-only" />
                <span className="text-sm font-medium">{a}</span>
              </label>
            ))}
          </div>
        </div>

        {/* First Visit Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">What to Expect — First Visit</h2>
          <textarea name="first_visit_info" defaultValue={profile?.first_visit_info || ''} placeholder="Describe what a new patient can expect on their first visit — how long it takes, what to bring, what happens during the consultation..." rows={4} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange resize-none" />
        </div>

        {/* Parking & Access */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">Parking & Accessibility</h2>
          <textarea name="parking_info" defaultValue={profile?.parking_info || ''} placeholder="Free parking in rear lot. Wheelchair accessible entrance on south side..." rows={2} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange resize-none" />
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">FAQ</h2>
          <input type="hidden" name="faq" value={JSON.stringify(faqItems)} />
          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-2">
                <input placeholder="Question" value={item.question} onChange={e => { const updated = [...faqItems]; updated[i] = {...updated[i], question: e.target.value}; setFaqItems(updated); setHasUnsavedChanges(true); }} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-neuro-orange" />
                <textarea placeholder="Answer" value={item.answer} onChange={e => { const updated = [...faqItems]; updated[i] = {...updated[i], answer: e.target.value}; setFaqItems(updated); setHasUnsavedChanges(true); }} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-neuro-orange resize-none" />
                <button type="button" onClick={() => { setFaqItems(prev => prev.filter((_, j) => j !== i)); setHasUnsavedChanges(true); }} className="text-xs text-red-500 font-bold flex items-center gap-1"><Trash2 className="w-3 h-3" /> Remove</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => { setFaqItems(prev => [...prev, { question: '', answer: '' }]); setHasUnsavedChanges(true); }} className="mt-3 text-sm font-bold text-neuro-orange flex items-center gap-1"><Plus className="w-4 h-4" /> Add Question</button>
        </div>

        {/* Team Members */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">Team Members</h2>
          <input type="hidden" name="team_members" value={JSON.stringify(teamMembers)} />
          <div className="space-y-3">
            {teamMembers.map((member, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gray-200 overflow-hidden flex-shrink-0">
                  {member.photo_url ? <img src={member.photo_url} alt="" className="w-full h-full object-cover" /> :
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg font-bold">{member.name?.[0] || '?'}</div>}
                </div>
                <div className="flex-1 space-y-2">
                  <input placeholder="Name" value={member.name} onChange={e => { const u = [...teamMembers]; u[i] = {...u[i], name: e.target.value}; setTeamMembers(u); setHasUnsavedChanges(true); }} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-neuro-orange" />
                  <input placeholder="Role (e.g. Chiropractic Assistant)" value={member.role} onChange={e => { const u = [...teamMembers]; u[i] = {...u[i], role: e.target.value}; setTeamMembers(u); setHasUnsavedChanges(true); }} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-neuro-orange" />
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={async () => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.onchange = async (ev: any) => { const f = ev.target.files?.[0]; if (!f) return; const fd = new FormData(); fd.append('file', f); const r = await uploadTeamPhoto(fd); if (r.success && r.publicUrl) { const u = [...teamMembers]; u[i] = {...u[i], photo_url: r.publicUrl}; setTeamMembers(u); setHasUnsavedChanges(true); } }; input.click(); }} className="text-xs text-neuro-orange font-bold">Upload Photo</button>
                    <button type="button" onClick={() => { setTeamMembers(prev => prev.filter((_, j) => j !== i)); setHasUnsavedChanges(true); }} className="text-xs text-red-500 font-bold flex items-center gap-1"><Trash2 className="w-3 h-3" /> Remove</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => { setTeamMembers(prev => [...prev, { name: '', role: '', photo_url: '' }]); setHasUnsavedChanges(true); }} className="mt-3 text-sm font-bold text-neuro-orange flex items-center gap-1"><Plus className="w-4 h-4" /> Add Team Member</button>
        </div>

        {/* Gallery */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">Photo Gallery</h2>
          <input type="hidden" name="gallery_images" value={JSON.stringify(galleryUrls)} />
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
            {galleryUrls.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => { setGalleryUrls(prev => prev.filter((_, j) => j !== i)); setHasUnsavedChanges(true); }} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
          {galleryUrls.length < 10 && (
            <button type="button" onClick={() => galleryInputRef.current?.click()} disabled={uploadingGallery} className="px-4 py-2 bg-neuro-navy text-white rounded-xl text-sm font-bold hover:bg-neuro-navy/90 disabled:opacity-50">
              {uploadingGallery ? 'Uploading...' : 'Add Photos'}
            </button>
          )}
          <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} />
          <p className="text-xs text-gray-400 mt-1">Up to 10 photos. JPG, PNG, WebP.</p>
        </div>

        {/* Banner Image */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">Banner Image</h2>
          {profile?.banner_url && (
            <div className="aspect-[3/1] rounded-xl overflow-hidden bg-gray-100 mb-4">
              <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover" />
            </div>
          )}
          <button type="button" onClick={() => bannerInputRef.current?.click()} disabled={uploadingBanner} className="px-4 py-2 bg-neuro-navy text-white rounded-xl text-sm font-bold hover:bg-neuro-navy/90 disabled:opacity-50">
            {uploadingBanner ? 'Uploading...' : profile?.banner_url ? 'Change Banner' : 'Upload Banner'}
          </button>
          <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
          <p className="text-xs text-gray-400 mt-1">Wide image for your profile header. Recommended 1400x400.</p>
        </div>

        {/* Save */}
        <button type="submit" disabled={saving} className="w-full py-3 px-6 bg-neuro-navy text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-neuro-navy/90 disabled:opacity-50">
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Profile'}
        </button>
        {profile?.slug && (
          <p className="text-center text-xs text-gray-400 mt-3">
            After saving, <Link href={`/directory/${profile.slug}`} target="_blank" className="text-neuro-orange font-bold hover:underline">preview your public profile</Link> to see what patients see.
          </p>
        )}
      </form>

      {/* Verified Badge */}
      <div className="mt-8">
        <VerifiedBadge doctorSlug={profile?.slug || ''} doctorName={profile?.full_name || ''} tier={profile?.membership_tier || 'basic'} />
      </div>
    </div>
  );
}
