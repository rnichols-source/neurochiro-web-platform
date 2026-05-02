"use client";

import { Camera, Loader2, Sparkles, Save, ExternalLink } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { getDoctorProfile, updateDoctorProfile, uploadAvatar, generateAIProfileBio } from "./actions";
import VerifiedBadge from "@/components/doctor/VerifiedBadge";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [showToast, setShowToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: "", type: 'success' });
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      .then((data) => { setProfile(data); })
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
      const img = new Image();
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
            <input name="city" defaultValue={profile?.city || ''} placeholder="City" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange" />
            <input name="state" defaultValue={profile?.state || ''} placeholder="State" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange" />
            <input name="country" defaultValue={profile?.country || ''} placeholder="Country (e.g. United States, Australia)" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange" />
            <input name="phone" defaultValue={profile?.phone || ''} placeholder="Clinic phone number" inputMode="tel" autoComplete="tel" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange" />
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
        <VerifiedBadge doctorSlug={profile?.slug || ''} doctorName={profile?.full_name || ''} tier={profile?.membership_tier || 'starter'} />
      </div>
    </div>
  );
}
