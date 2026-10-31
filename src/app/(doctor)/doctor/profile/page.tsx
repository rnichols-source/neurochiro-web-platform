"use client";

import { Camera, Loader2, Plus, Trash2 } from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/components/portal/PageHeader";
import StudentOptIn from "@/components/doctor/StudentOptIn";
import VerifiedBadge from "@/components/doctor/VerifiedBadge";
import { getDoctorProfile, updateDoctorProfile, uploadAvatar, uploadGalleryImage, uploadBannerImage, uploadTeamPhoto } from "./actions";

const INPUT = "w-full min-h-11 px-3 rounded-lg border border-portal-border bg-white text-base";
const AREA = "w-full px-3 py-2 rounded-lg border border-portal-border bg-white text-base";
const AMENITY_OPTIONS = ["Kid-Friendly", "Wheelchair Accessible", "Open Adjusting", "Private Rooms", "Digital X-Ray", "On-Site Parking", "Prenatal Room", "Same-Day Appointments", "Baby Changing Station", "Play Area"];

const TABS = [
  { id: "basics", label: "Basics" },
  { id: "photos", label: "Photos" },
  { id: "about", label: "About" },
  { id: "services", label: "Services & pricing" },
  { id: "insurance", label: "Insurance & payment" },
  { id: "links", label: "Links" },
] as const;

type TabId = (typeof TABS)[number]["id"];

type DoctorProfile = {
  slug?: string;
  email?: string;
  full_name?: string;
  clinic_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  website_url?: string;
  bio?: string;
  seo_keywords?: string;
  education?: string[] | string | null;
  photo_url?: string;
  banner_url?: string;
  video_url?: string;
  short_intro?: string;
  philosophy?: string;
  specialties?: string[];
  hours?: string;
  chiropractic_school?: string;
  first_visit_price?: string;
  payment_model?: string;
  languages?: string[];
  highlights?: string[];
  conditions_treated?: string[];
  certifications?: string[];
  post_doctoral_training?: string[];
  degree?: string;
  graduation_year?: number | string;
  years_in_practice?: number | string;
  accepted_payment?: string[];
  insurance_networks?: string[];
  google_reviews_url?: string;
  booking_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  tiktok_url?: string;
  first_visit_info?: string;
  parking_info?: string;
  verification_status?: string;
  membership_tier?: string;
  accepting_new_patients?: boolean;
  offers_telehealth?: boolean;
  accepts_walkins?: boolean;
  accepts_student_messages?: boolean;
  files_insurance?: boolean;
  payment_plans?: boolean;
  free_consultation?: boolean;
  has_evening_hours?: boolean;
  has_weekend_hours?: boolean;
  faq?: { question: string; answer: string }[];
  team_members?: { name: string; role: string; photo_url: string }[];
  gallery_images?: string[];
  amenities?: string[];
};

function isTab(value: string | null): value is TabId {
  return TABS.some((tab) => tab.id === value);
}

function parseTab(value: string | null): TabId {
  return isTab(value) ? value : "basics";
}

function asLines(value: unknown): string {
  if (Array.isArray(value)) return value.map((item) => String(item)).join("\n");
  if (typeof value === "string") return value;
  return "";
}

async function convertToJpeg(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error("Conversion failed")); return; }
        resolve(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }));
      }, "image/jpeg", 0.9);
    };
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = URL.createObjectURL(file);
  });
}

function isHeic(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith(".heic") || name.endsWith(".heif") || file.type === "image/heic" || file.type === "image/heif";
}

function compressImage(file: File, maxWidth: number, quality: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("No canvas context")); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error("Compression failed")); return; }
        resolve(new File([blob], file.name, { type: "image/jpeg" }));
      }, "image/jpeg", quality);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-portal-border rounded-xl p-4 space-y-4">
      <div>
        <h2 className="text-lg font-bold text-portal-ink">{title}</h2>
        {hint ? <p className="mt-1 text-sm text-portal-ink-2">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Label({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-bold text-portal-ink mb-1">{label}</span>
      {children}
      {hint ? <span className="block mt-1 text-sm text-portal-ink-2">{hint}</span> : null}
    </label>
  );
}

function ProfileEditor() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<TabId>(() => parseTab(searchParams.get("tab")));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [showToast, setShowToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({ show: false, message: "", type: "success" });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const [faqItems, setFaqItems] = useState<{ question: string; answer: string }[]>([]);
  const [teamMembers, setTeamMembers] = useState<{ name: string; role: string; photo_url: string }[]>([]);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [amenitiesSelected, setAmenitiesSelected] = useState<string[]>([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [error, setError] = useState(false);
  const [loadError, setLoadError] = useState(false);

  function selectTab(next: TabId) {
    setTab(next);
    const params = new URLSearchParams(window.location.search);
    if (next === "basics") params.delete("tab");
    else params.set("tab", next);
    const query = params.toString();
    window.history.replaceState(null, "", query ? `${window.location.pathname}?${query}` : window.location.pathname);
  }

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!hasUnsavedChanges) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!anchor) return;
      const linkTarget = anchor.getAttribute("target");
      if (linkTarget && linkTarget !== "_self") return;
      const href = anchor.getAttribute("href") || "";
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("/directory/")) return;
      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      const ok = window.confirm("You have unsaved changes. Leave without saving?");
      if (!ok) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    getDoctorProfile()
      .then((data) => {
        if (!data || (!data.slug && !data.clinic_name && !data.email)) {
          setLoadError(true);
          return;
        }
        const loaded = data as DoctorProfile;
        setProfile(loaded);
        setFaqItems(Array.isArray(loaded.faq) ? loaded.faq : []);
        setTeamMembers(Array.isArray(loaded.team_members) ? loaded.team_members : []);
        setGalleryUrls(Array.isArray(loaded.gallery_images) ? loaded.gallery_images : []);
        setAmenitiesSelected(Array.isArray(loaded.amenities) ? loaded.amenities : []);
      })
      .catch(() => { setError(true); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const anchor = headerRef.current?.querySelector('a[href^="/directory/"]');
    if (!anchor) return;
    anchor.setAttribute("target", "_blank");
    anchor.setAttribute("rel", "noopener noreferrer");
  }, [profile?.slug]);

  const toast = (message: string, type: "success" | "error" = "success") => {
    setShowToast({ show: true, message, type });
    setTimeout(() => setShowToast({ show: false, message: "", type: "success" }), 3000);
  };

  const markDirty = () => {
    setHasUnsavedChanges(true);
    setSaveSuccess(false);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const result = await updateDoctorProfile(new FormData(e.currentTarget));
    setSaving(false);
    if (result.success) {
      setHasUnsavedChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
    toast(result.success ? "Profile saved." : (result.error || "Failed to save."), result.success ? "success" : "error");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let processedFile = file;
    if (isHeic(file)) {
      try {
        processedFile = await convertToJpeg(file);
      } catch {
        processedFile = file;
      }
    }

    if (processedFile.size > 5 * 1024 * 1024) {
      toast("Image too large. Please use a photo under 5MB.", "error");
      return;
    }

    let uploadFile = processedFile;
    if (processedFile.size > 1 * 1024 * 1024) {
      try {
        uploadFile = await compressImage(processedFile, 800, 0.8);
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
      setProfile((p) => (p ? { ...p, photo_url: result.publicUrl } : p));
      toast("Photo updated.");
    } else toast(result.error || "Upload failed.", "error");
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    let processedFile = file;
    if (isHeic(file)) {
      try { processedFile = await convertToJpeg(file); } catch { processedFile = file; }
    }
    let uploadFile = processedFile;
    if (processedFile.size > 1 * 1024 * 1024) {
      try { uploadFile = await compressImage(processedFile, 1400, 0.85); } catch { /* use original */ }
    }
    const fd = new FormData();
    fd.append("file", uploadFile);
    const result = await uploadBannerImage(fd);
    setUploadingBanner(false);
    if (result.success) { setProfile((p) => (p ? { ...p, banner_url: result.publicUrl } : p)); toast("Banner updated."); }
    else toast(result.error || "Upload failed.", "error");
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingGallery(true);
    for (let i = 0; i < Math.min(files.length, 10 - galleryUrls.length); i++) {
      let processedFile: File = files[i];
      if (isHeic(processedFile)) {
        try { processedFile = await convertToJpeg(processedFile); } catch { /* server handles it */ }
      }
      let uploadFile = processedFile;
      if (processedFile.size > 1 * 1024 * 1024) {
        try { uploadFile = await compressImage(processedFile, 1000, 0.8); } catch { /* use original */ }
      }
      const fd = new FormData();
      fd.append("file", uploadFile);
      const result = await uploadGalleryImage(fd);
      if (result.success && result.publicUrl) setGalleryUrls((prev) => [...prev, result.publicUrl!]);
    }
    setUploadingGallery(false);
    setHasUnsavedChanges(true);
    toast("Photos added. Save to keep them.");
  };

  const openLiveProfile = (event: React.MouseEvent<HTMLDivElement>) => {
    const anchor = (event.target as HTMLElement).closest('a[href^="/directory/"]');
    if (!anchor) return;
    anchor.setAttribute("target", "_blank");
    anchor.setAttribute("rel", "noopener noreferrer");
  };

  const educationLines = asLines(profile?.education);
  const checks = [
    { done: !!profile?.photo_url, label: "Profile photo", why: "Patients look for a face before they call." },
    { done: !!(profile?.bio && profile.bio.length >= 20) || !!(profile?.short_intro && profile.short_intro.length >= 20), label: "Bio or intro", why: "Tells patients who you are and what you do." },
    { done: !!profile?.chiropractic_school, label: "Education", why: "Patients want to know where you trained." },
    { done: (profile?.specialties || []).length > 0, label: "Specialties", why: "Helps patients find you when searching." },
    { done: !!profile?.hours, label: "Office hours", why: "Patients check hours before calling." },
    { done: !!profile?.first_visit_price || !!profile?.payment_model, label: "Cost and insurance", why: "Patients ask this before they book." },
    { done: !!profile?.phone, label: "Phone number", why: "Many patients prefer to call." },
    { done: !!profile?.booking_url, label: "Online booking link", why: "Patients who can book online are more likely to show up." },
    { done: !!profile?.google_reviews_url, label: "Google Reviews link", why: "Reviews help patients decide." },
  ];
  const doneCount = checks.filter((item) => item.done).length;
  const pct = Math.round((doneCount / checks.length) * 100);
  const missing = checks.filter((item) => !item.done);

  return (
    <div className="pb-36 md:pb-28">
      {showToast.show && (
        <div className={`fixed top-4 right-4 z-[170] px-4 py-3 rounded-xl text-sm font-bold shadow-lg bg-white border ${showToast.type === "success" ? "border-green-200 text-green-800" : "border-red-200 text-red-700"}`}>
          {showToast.message}
        </div>
      )}

      <div ref={headerRef} onClickCapture={openLiveProfile}>
        <PageHeader
          title="Your profile"
          description="This is what patients see on neurochiro.co."
          secondary={profile?.slug ? { label: "View live profile", href: `/directory/${profile.slug}` } : undefined}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-portal-accent animate-spin" /></div>
      ) : error || loadError ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <h2 className="text-xl font-bold text-portal-ink mb-2">Could not load your profile</h2>
          <p className="text-portal-ink-2 text-sm mb-4">Something went wrong loading your profile data. Please try again.</p>
          <button type="button" onClick={() => window.location.reload()} className="min-h-11 px-6 rounded-lg bg-portal-accent text-white text-sm font-bold">
            Retry
          </button>
        </div>
      ) : (
        <>
          {profile?.verification_status === "verified" && profile?.slug && (
            <p className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">Your profile is live in the directory.</p>
          )}
          {profile?.verification_status === "pending" && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-sm font-bold text-yellow-800">Your profile is under review.</p>
              <p className="text-sm text-yellow-800 mt-1">Most profiles are reviewed within 24-48 hours. You will get a notification when it goes live.</p>
            </div>
          )}

          <StudentOptIn />
          <section className="bg-white border border-portal-border rounded-xl p-4 mb-4">
            <h2 className="text-lg font-bold text-portal-ink">Profile photo</h2>
            <div className="mt-4 flex items-center gap-4">
              <div className="relative w-24 h-24 rounded-xl bg-portal-surface overflow-hidden border border-portal-border shrink-0">
                {profile?.photo_url ? (
                  <Image src={profile.photo_url} alt="Profile photo" fill className="object-cover" sizes="96px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-portal-muted"><Camera className="w-8 h-8" /></div>
                )}
              </div>
              <div>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="min-h-11 px-4 rounded-lg bg-portal-ink text-white text-sm font-bold">
                  Upload photo
                </button>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" className="hidden" onChange={handleImageUpload} />
                <p className="text-sm text-portal-ink-2 mt-1">JPG, PNG, WebP, or HEIC. Max 5MB.</p>
              </div>
            </div>
          </section>

          <section className="bg-white border border-portal-border rounded-xl p-4 mb-4">
            <h2 className="text-lg font-bold text-portal-ink">Profile completeness</h2>
            <div className="flex items-center gap-3 mt-3 mb-3">
              <div className="flex-1 h-2 bg-portal-surface rounded-full overflow-hidden">
                <div className="h-full bg-portal-accent rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-sm font-bold text-portal-accent">{pct}%</span>
            </div>
            {missing.length > 0 && (
              <ul className="space-y-2">
                {missing.slice(0, 3).map((item) => (
                  <li key={item.label} className="text-sm text-portal-ink-2">
                    <span className="font-bold text-portal-ink">{item.label}.</span> {item.why}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="sticky top-0 z-30 -mx-4 md:-mx-8 px-4 md:px-8 py-2 bg-portal-canvas">
            <div role="tablist" aria-label="Profile sections" className="flex gap-1 overflow-x-auto bg-portal-surface p-1 rounded-xl">
              {TABS.map((item) => {
                const selected = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    id={`profile-tab-${item.id}`}
                    aria-selected={selected}
                    aria-controls={`profile-panel-${item.id}`}
                    onClick={() => selectTab(item.id)}
                    className={`shrink-0 min-h-11 px-3 rounded-lg text-sm font-bold ${selected ? "bg-white text-portal-ink shadow-sm" : "text-portal-ink-2"}`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSave} onChange={markDirty} className="mt-4 space-y-4">
            {profile?.bio ? <input type="hidden" name="bio" value={profile.bio} /> : null}
            {profile?.seo_keywords ? <input type="hidden" name="seo_keywords" value={profile.seo_keywords} /> : null}
            {educationLines ? <input type="hidden" name="education" value={educationLines} /> : null}

            <div id="profile-panel-basics" role="tabpanel" aria-labelledby="profile-tab-basics" hidden={tab !== "basics"} className="space-y-4">
              <Section title="Personal info">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Label label="First name">
                    <input name="first_name" defaultValue={profile?.first_name || ""} placeholder="First name" autoComplete="given-name" className={INPUT} />
                  </Label>
                  <Label label="Last name">
                    <input name="last_name" defaultValue={profile?.last_name || ""} placeholder="Last name" autoComplete="family-name" className={INPUT} />
                  </Label>
                </div>
              </Section>

              <Section title="Clinic">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Label label="Clinic name">
                    <input name="clinic_name" defaultValue={profile?.clinic_name || ""} placeholder="Clinic name" className={INPUT} />
                  </Label>
                  <Label label="Phone">
                    <input name="phone" defaultValue={profile?.phone || ""} placeholder="Clinic phone number" inputMode="tel" autoComplete="tel" className={INPUT} />
                  </Label>
                  <div className="md:col-span-2">
                    <Label label="Street address">
                      <input name="address" defaultValue={profile?.address || ""} placeholder="Street address" autoComplete="street-address" className={INPUT} />
                    </Label>
                  </div>
                  <Label label="City">
                    <input name="city" defaultValue={profile?.city || ""} placeholder="City" className={INPUT} />
                  </Label>
                  <Label label="State or province">
                    <input name="state" defaultValue={profile?.state || ""} placeholder="State or province" className={INPUT} />
                  </Label>
                  <Label label="Country">
                    <input name="country" defaultValue={profile?.country || ""} placeholder="US, CA, GB, NZ, or AU" className={INPUT} />
                  </Label>
                </div>
              </Section>

              <Section title="Office hours">
                <textarea name="hours" defaultValue={profile?.hours || ""} placeholder={"Monday: 9:00 AM – 6:00 PM\nTuesday: 9:00 AM – 6:00 PM\nWednesday: Closed"} rows={4} className={AREA} />
              </Section>

              <Section title="Languages">
                <input name="languages" defaultValue={(profile?.languages || []).join(", ")} placeholder="English, Spanish" className={INPUT} />
              </Section>

              <Section title="Availability">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-center gap-3 min-h-11 px-3 rounded-lg bg-portal-surface text-base text-portal-ink">
                    <input type="checkbox" name="accepting_new_patients" value="true" defaultChecked={profile?.accepting_new_patients !== false} className="w-5 h-5 accent-[#d66829]" />
                    {/* After the checkbox so FormData.get keeps "true" when it is checked. */}
                    <input type="hidden" name="accepting_new_patients" value="false" />
                    Accepting new patients
                  </label>
                  <label className="flex items-center gap-3 min-h-11 px-3 rounded-lg bg-portal-surface text-base text-portal-ink">
                    <input type="checkbox" name="offers_telehealth" value="true" defaultChecked={profile?.offers_telehealth === true} className="w-5 h-5 accent-[#d66829]" />
                    Telehealth available
                  </label>
                  <label className="flex items-center gap-3 min-h-11 px-3 rounded-lg bg-portal-surface text-base text-portal-ink">
                    <input type="checkbox" name="accepts_walkins" value="true" defaultChecked={profile?.accepts_walkins === true} className="w-5 h-5 accent-[#d66829]" />
                    Walk-ins welcome
                  </label>
                  <label className="flex items-start gap-3 min-h-11 px-3 py-2 rounded-lg bg-portal-surface text-base text-portal-ink">
                    <input type="checkbox" name="accepts_student_messages" value="true" defaultChecked={profile?.accepts_student_messages === true} className="w-5 h-5 mt-1 accent-[#d66829]" />
                    <span>
                      Open to student messages
                      <span className="block text-sm text-portal-ink-2">Let chiropractic students message you about mentorship and associate opportunities.</span>
                    </span>
                  </label>
                </div>
              </Section>
            </div>

            <div id="profile-panel-photos" role="tabpanel" aria-labelledby="profile-tab-photos" hidden={tab !== "photos"} className="space-y-4">
              <p className="text-sm text-portal-ink-2">Your profile photo is at the top of this page.</p>
              <Section title="Intro video" hint="Add a short intro video so patients can meet you before they call.">
                <div id="video">
                  <Label label="Video URL">
                    <input name="video_url" defaultValue={profile?.video_url || ""} placeholder="YouTube or Vimeo link" className={INPUT} />
                  </Label>
                </div>
              </Section>

              <Section title="Banner image" hint="Wide image for your profile header. Recommended 1400x400.">
                {profile?.banner_url && (
                  <div className="aspect-[3/1] rounded-xl overflow-hidden bg-portal-surface">
                    <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover" />
                  </div>
                )}
                <button type="button" onClick={() => bannerInputRef.current?.click()} disabled={uploadingBanner} className="min-h-11 px-4 rounded-lg bg-portal-ink text-white text-sm font-bold disabled:opacity-50">
                  {uploadingBanner ? "Uploading..." : profile?.banner_url ? "Change banner" : "Upload banner"}
                </button>
                <input ref={bannerInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" className="hidden" onChange={handleBannerUpload} />
              </Section>

              <Section title="Photo gallery" hint="Up to 10 photos. JPG, PNG, or WebP.">
                <input type="hidden" name="gallery_images" value={JSON.stringify(galleryUrls)} />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {galleryUrls.map((url, i) => (
                    <div key={`${url}-${i}`} className="relative aspect-square rounded-xl overflow-hidden bg-portal-surface">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => { setGalleryUrls((prev) => prev.filter((_, j) => j !== i)); markDirty(); }}
                        className="absolute top-1 right-1 min-h-11 min-w-11 bg-white text-portal-ink border border-portal-border rounded-lg flex items-center justify-center"
                        aria-label={`Remove photo ${i + 1}`}
                        title={`Remove photo ${i + 1}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                {galleryUrls.length < 10 && (
                  <button type="button" onClick={() => galleryInputRef.current?.click()} disabled={uploadingGallery} className="min-h-11 px-4 rounded-lg bg-portal-ink text-white text-sm font-bold disabled:opacity-50">
                    {uploadingGallery ? "Uploading..." : "Add photos"}
                  </button>
                )}
                <input ref={galleryInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" multiple className="hidden" onChange={handleGalleryUpload} />
              </Section>
            </div>

            <div id="profile-panel-about" role="tabpanel" aria-labelledby="profile-tab-about" hidden={tab !== "about"} className="space-y-4">
              <Section title="About you" hint="This is what patients read first. Keep it personal and direct.">
                <Label label="Short intro" hint="2-3 sentences about you and your practice. No URLs or phone numbers.">
                  <textarea
                    name="short_intro"
                    value={profile?.short_intro || ""}
                    onChange={(e) => { if (e.target.value.length <= 500) setProfile((p) => (p ? { ...p, short_intro: e.target.value } : p)); }}
                    placeholder="I'm a nervous system chiropractor in Austin, TX specializing in families and pediatric care."
                    rows={3}
                    className={AREA}
                  />
                  <span className={`block text-right text-sm mt-1 ${(profile?.short_intro?.length || 0) > 450 ? "text-red-600 font-bold" : "text-portal-ink-2"}`}>{profile?.short_intro?.length || 0}/500</span>
                </Label>
                <Label label="Philosophy" hint="Optional. Your approach to care. No URLs or phone numbers.">
                  <textarea
                    name="philosophy"
                    value={profile?.philosophy || ""}
                    onChange={(e) => { if (e.target.value.length <= 1000) setProfile((p) => (p ? { ...p, philosophy: e.target.value } : p)); }}
                    placeholder="I believe the body is designed to heal when the nervous system is functioning properly."
                    rows={3}
                    className={AREA}
                  />
                  <span className={`block text-right text-sm mt-1 ${(profile?.philosophy?.length || 0) > 900 ? "text-red-600 font-bold" : "text-portal-ink-2"}`}>{profile?.philosophy?.length || 0}/1000</span>
                </Label>
              </Section>

              <Section title="Why patients choose you" hint="One highlight per line.">
                <textarea name="highlights" defaultValue={(profile?.highlights || []).join("\n")} placeholder={"Board certified\nFamily-friendly office"} rows={4} className={AREA} />
              </Section>

              <Section title="Education" hint="Patients want to know where you trained. This shows on your profile.">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Label label="Chiropractic school">
                    <input name="chiropractic_school" defaultValue={profile?.chiropractic_school || ""} placeholder="Life University" className={INPUT} />
                  </Label>
                  <Label label="Degree">
                    <input name="degree" defaultValue={profile?.degree || "Doctor of Chiropractic (DC)"} className={INPUT} />
                  </Label>
                  <Label label="Graduation year">
                    <input name="graduation_year" type="number" min="1950" max="2030" defaultValue={profile?.graduation_year || ""} placeholder="2018" className={INPUT} />
                  </Label>
                </div>
                <Label label="Post-doctoral training" hint="Optional. One item per line.">
                  <textarea name="post_doctoral_training" defaultValue={(profile?.post_doctoral_training || []).join("\n")} placeholder={"Webster Technique Certification — ICPA"} rows={3} className={AREA} />
                </Label>
              </Section>

              <Section title="Practice details">
                <Label label="Years in practice">
                  <input name="years_in_practice" type="number" defaultValue={profile?.years_in_practice || ""} placeholder="12" className={INPUT} />
                </Label>
                <Label label="Certifications" hint="One per line.">
                  <textarea name="certifications" defaultValue={(profile?.certifications || []).join("\n")} placeholder={"Webster Certified\nICPA Member"} rows={3} className={AREA} />
                </Label>
              </Section>

              <Section title="FAQ">
                <input type="hidden" name="faq" value={JSON.stringify(faqItems)} />
                <div className="space-y-3">
                  {faqItems.map((item, i) => (
                    <div key={i} className="bg-portal-surface rounded-xl p-4 space-y-2">
                      <input placeholder="Question" value={item.question} onChange={(e) => { const updated = [...faqItems]; updated[i] = { ...updated[i], question: e.target.value }; setFaqItems(updated); markDirty(); }} className={INPUT} />
                      <textarea placeholder="Answer" value={item.answer} onChange={(e) => { const updated = [...faqItems]; updated[i] = { ...updated[i], answer: e.target.value }; setFaqItems(updated); markDirty(); }} rows={2} className={AREA} />
                      <button type="button" onClick={() => { setFaqItems((prev) => prev.filter((_, j) => j !== i)); markDirty(); }} className="min-h-11 inline-flex items-center gap-1 text-sm font-bold text-red-600">
                        <Trash2 className="w-4 h-4" /> Remove
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => { setFaqItems((prev) => [...prev, { question: "", answer: "" }]); markDirty(); }} className="min-h-11 inline-flex items-center gap-1 text-sm font-bold text-portal-accent">
                  <Plus className="w-4 h-4" /> Add question
                </button>
              </Section>

              <Section title="Team members">
                <input type="hidden" name="team_members" value={JSON.stringify(teamMembers)} />
                <div className="space-y-3">
                  {teamMembers.map((member, i) => (
                    <div key={i} className="bg-portal-surface rounded-xl p-4 flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-white overflow-hidden shrink-0 border border-portal-border">
                        {member.photo_url ? <img src={member.photo_url} alt="" className="w-full h-full object-cover" /> :
                          <div className="w-full h-full flex items-center justify-center text-portal-ink-2 text-lg font-bold">{member.name?.[0] || "?"}</div>}
                      </div>
                      <div className="flex-1 space-y-2">
                        <input placeholder="Name" value={member.name} onChange={(e) => { const u = [...teamMembers]; u[i] = { ...u[i], name: e.target.value }; setTeamMembers(u); markDirty(); }} className={INPUT} />
                        <input placeholder="Role (for example, Chiropractic Assistant)" value={member.role} onChange={(e) => { const u = [...teamMembers]; u[i] = { ...u[i], role: e.target.value }; setTeamMembers(u); markDirty(); }} className={INPUT} />
                        <div className="flex flex-wrap items-center gap-2">
                          <button type="button" onClick={() => { const input = document.createElement("input"); input.type = "file"; input.accept = "image/*"; input.onchange = async () => { const f = input.files?.[0]; if (!f) return; const fd = new FormData(); fd.append("file", f); const r = await uploadTeamPhoto(fd); if (r.success && r.publicUrl) { const u = [...teamMembers]; u[i] = { ...u[i], photo_url: r.publicUrl }; setTeamMembers(u); markDirty(); } }; input.click(); }} className="min-h-11 text-sm font-bold text-portal-accent">Upload Photo</button>
                          <button type="button" onClick={() => { setTeamMembers((prev) => prev.filter((_, j) => j !== i)); markDirty(); }} className="min-h-11 inline-flex items-center gap-1 text-sm font-bold text-red-600">
                            <Trash2 className="w-4 h-4" /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => { setTeamMembers((prev) => [...prev, { name: "", role: "", photo_url: "" }]); markDirty(); }} className="min-h-11 inline-flex items-center gap-1 text-sm font-bold text-portal-accent">
                  <Plus className="w-4 h-4" /> Add team member
                </button>
              </Section>
            </div>

            <div id="profile-panel-services" role="tabpanel" aria-labelledby="profile-tab-services" hidden={tab !== "services"} className="space-y-4">
              <Section title="Specialties" hint="Comma separated.">
                <input name="specialties" defaultValue={(profile?.specialties || []).join(", ")} placeholder="Nervous system focused, Pediatric, Upper cervical" className={INPUT} />
              </Section>
              <Section title="Patients we help" hint="Comma separated.">
                <input name="conditions_treated" defaultValue={(profile?.conditions_treated || []).join(", ")} placeholder="Back pain, Neck pain, Headaches and migraines" className={INPUT} />
              </Section>
              <Section title="What to expect on the first visit">
                <textarea name="first_visit_info" defaultValue={profile?.first_visit_info || ""} placeholder="How long it takes, what to bring, and what happens during the visit." rows={4} className={AREA} />
              </Section>
              <Section title="Amenities">
                <input type="hidden" name="amenities" value={amenitiesSelected.join(",")} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {AMENITY_OPTIONS.map((amenity) => (
                    <label key={amenity} className={`flex items-center gap-2 min-h-11 px-3 rounded-lg cursor-pointer border text-base ${amenitiesSelected.includes(amenity) ? "bg-portal-accent-50 border-portal-accent text-portal-ink" : "bg-portal-surface border-portal-border text-portal-ink-2"}`}>
                      <input type="checkbox" checked={amenitiesSelected.includes(amenity)} onChange={(e) => { if (e.target.checked) setAmenitiesSelected((prev) => [...prev, amenity]); else setAmenitiesSelected((prev) => prev.filter((item) => item !== amenity)); markDirty(); }} className="sr-only" />
                      {amenity}
                    </label>
                  ))}
                </div>
              </Section>
              <Section title="Parking and accessibility">
                <textarea name="parking_info" defaultValue={profile?.parking_info || ""} placeholder="Free parking in the rear lot. Wheelchair accessible entrance on the south side." rows={2} className={AREA} />
              </Section>
            </div>

            <div id="profile-panel-insurance" role="tabpanel" aria-labelledby="profile-tab-insurance" hidden={tab !== "insurance"} className="space-y-4">
              <Section title="Insurance and payment" hint="Patients check this before they book. Even “Call for pricing” is better than blank.">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Label label="First visit price" hint='Or "Call for pricing".'>
                    <input name="first_visit_price" defaultValue={profile?.first_visit_price || ""} placeholder="$150-$250 or Call for pricing" className={INPUT} />
                  </Label>
                  <Label label="Payment model">
                    <select name="payment_model" defaultValue={profile?.payment_model || ""} className={INPUT}>
                      <option value="">Select...</option>
                      <option value="cash">Cash-based (no insurance)</option>
                      <option value="insurance">Insurance accepted</option>
                      <option value="both">Cash and insurance</option>
                    </select>
                  </Label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-center gap-3 min-h-11 text-base text-portal-ink">
                    <input type="checkbox" name="files_insurance" value="true" defaultChecked={profile?.files_insurance} className="w-5 h-5 accent-[#d66829]" />
                    Files insurance for patients
                  </label>
                  <label className="flex items-center gap-3 min-h-11 text-base text-portal-ink">
                    <input type="checkbox" name="payment_plans" value="true" defaultChecked={profile?.payment_plans} className="w-5 h-5 accent-[#d66829]" />
                    Payment plans available
                  </label>
                  <label className="flex items-center gap-3 min-h-11 text-base text-portal-ink">
                    <input type="checkbox" name="free_consultation" value="true" defaultChecked={profile?.free_consultation} className="w-5 h-5 accent-[#d66829]" />
                    Free consultation offered
                  </label>
                  <label className="flex items-center gap-3 min-h-11 text-base text-portal-ink">
                    <input type="checkbox" name="has_evening_hours" value="true" defaultChecked={profile?.has_evening_hours} className="w-5 h-5 accent-[#d66829]" />
                    Evening hours
                  </label>
                  <label className="flex items-center gap-3 min-h-11 text-base text-portal-ink">
                    <input type="checkbox" name="has_weekend_hours" value="true" defaultChecked={profile?.has_weekend_hours} className="w-5 h-5 accent-[#d66829]" />
                    Weekend hours
                  </label>
                </div>
                <Label label="Accepted payment methods" hint="Comma separated.">
                  <input name="accepted_payment" defaultValue={(profile?.accepted_payment || []).join(", ")} placeholder="Cash, Credit card, HSA, Insurance" className={INPUT} />
                </Label>
                <Label label="Insurance networks" hint="Comma separated.">
                  <input name="insurance_networks" defaultValue={(profile?.insurance_networks || []).join(", ")} placeholder="Blue Cross, Aetna, United, Cigna" className={INPUT} />
                </Label>
              </Section>
            </div>

            <div id="profile-panel-links" role="tabpanel" aria-labelledby="profile-tab-links" hidden={tab !== "links"} className="space-y-4">
              <Section title="Website and social">
                <Label label="Website">
                  <input name="website" defaultValue={profile?.website_url || ""} placeholder="https://yourpractice.com" className={INPUT} />
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Label label="Instagram">
                    <input name="instagram_url" defaultValue={profile?.instagram_url || ""} placeholder="https://instagram.com/yourpractice" className={INPUT} />
                  </Label>
                  <Label label="Facebook">
                    <input name="facebook_url" defaultValue={profile?.facebook_url || ""} placeholder="https://facebook.com/yourpractice" className={INPUT} />
                  </Label>
                  <Label label="TikTok">
                    <input name="tiktok_url" defaultValue={profile?.tiktok_url || ""} placeholder="https://tiktok.com/@yourhandle" className={INPUT} />
                  </Label>
                </div>
              </Section>
              <Section title="Booking and reviews">
                <Label label="Online booking">
                  <input name="booking_url" defaultValue={profile?.booking_url || ""} placeholder="Jane, ChiroTouch, Fresha, or another booking link" className={INPUT} />
                </Label>
                <Label label="Google Reviews" hint="Patients trust reviews more than anything else on this page.">
                  <input name="google_reviews_url" defaultValue={profile?.google_reviews_url || ""} placeholder="https://g.page/your-practice/review" className={INPUT} />
                </Label>
              </Section>
            </div>

            <div className="fixed z-[160] inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] md:bottom-0 md:left-72 bg-white border-t border-portal-border px-4 py-3 flex items-center justify-between gap-3">
              <p className="text-sm text-portal-ink-2" aria-live="polite">
                {saveSuccess ? "Saved" : hasUnsavedChanges ? "Unsaved changes" : ""}
              </p>
              <button type="submit" disabled={saving} className="min-h-11 px-4 rounded-lg bg-portal-accent text-white text-sm font-bold disabled:opacity-50">
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <VerifiedBadge doctorSlug={profile?.slug || ""} doctorName={profile?.full_name || ""} tier={profile?.membership_tier || "basic"} />
          </div>
        </>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-portal-accent animate-spin" /></div>}>
      <ProfileEditor />
    </Suspense>
  );
}
