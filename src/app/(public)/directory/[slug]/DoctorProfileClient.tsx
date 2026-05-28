"use client";

import { useState, useEffect, useMemo } from "react";
import PublicBadges from "./public-badges";
import {
  MapPin, ShieldCheck, CheckCircle2, Mail, ExternalLink, MessageSquare,
  Loader2, Phone, Heart, Share2, Calendar, Send, Globe, Users, Star,
  Copy, Instagram, Facebook, Award, Clock, Stethoscope, GraduationCap,
  ChevronDown, ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { useUserPreferences } from "@/context/UserPreferencesContext";
import { sendReferral } from "@/app/actions/referrals";
import { submitPatientStory, getApprovedStories } from "@/app/actions/patient-stories";
import { isProfileGated } from "@/lib/profile-gating";
import ContactGateCTA from "@/components/directory/ContactGateCTA";
import GoogleReviews from "@/components/directory/GoogleReviews";
import Image from "next/image";
import { getEpisodeByDoctorSlug } from "../../spotlight/spotlight-data";

function formatUrl(url: string | null | undefined): string | null {
  if (!url || !url.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://${trimmed}`;
}

export default function DoctorProfileClient({ doctor, slug, seminars = [], jobs = [] }: { doctor: any, slug: string, seminars?: any[], jobs?: any[] }) {
  const { toggleSave, isSaved } = useUserPreferences();
  const [copied, setCopied] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [stories, setStories] = useState<any[]>([]);
  const [showStoryForm, setShowStoryForm] = useState(false);
  const [storySubmitted, setStorySubmitted] = useState(false);
  const [storyForm, setStoryForm] = useState({ patientFirstName: '', conditionBefore: '', outcomeAfter: '', storyText: '' });
  const [submittingStory, setSubmittingStory] = useState(false);
  const [appointmentSubmitted, setAppointmentSubmitted] = useState(false);
  const [submittingAppointment, setSubmittingAppointment] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({ name: '', email: '', phone: '', preferredDate: '', message: '' });
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralSent, setReferralSent] = useState(false);
  const [referring, setReferring] = useState(false);
  const [referralPatientName, setReferralPatientName] = useState('');
  const [referralNotes, setReferralNotes] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const supabase = createClient();

  const [photoError, setPhotoError] = useState(false);
  const gated = isProfileGated(doctor);
  const saved = isSaved('doctors', doctor.id?.toString());
  const name = `Dr. ${doctor.first_name || ''} ${doctor.last_name || ''}`.trim();
  const spotlightEpisode = getEpisodeByDoctorSlug(slug);
  const location = [doctor.city, doctor.state].filter(Boolean).join(", ");
  const specialties = doctor.specialties || [];
  const d = doctor as any;

  // Extended fields
  const bannerUrl = d.banner_url as string | null;
  const instagramUrl = d.instagram_url as string | null;
  const facebookUrl = d.facebook_url as string | null;
  const highlights = d.highlights as string[] | null;
  const conditionsTreated = d.conditions_treated as string[] | null;
  const education = d.education as string[] | null;
  const languages = d.languages as string[] | null;
  const hours = d.hours as string | null;
  const acceptedPayment = d.accepted_payment as string[] | null;
  const faq = d.faq as { question: string; answer: string }[] | null;
  const galleryImages = d.gallery_images as string[] | null;
  const bookingUrl = d.booking_url as string | null;
  const firstVisitInfo = d.first_visit_info as string | null;
  const parkingInfo = d.parking_info as string | null;
  const amenitiesList = d.amenities as string[] | null;
  const offersTelehealth = d.offers_telehealth as boolean;
  const acceptsWalkins = d.accepts_walkins as boolean;
  const acceptingNewPatients = d.accepting_new_patients as boolean;
  const yearsInPractice = d.years_in_practice as number | null;
  const insuranceNetworks = d.insurance_networks as string[] | null;
  const teamMembersList = d.team_members as { name: string; role: string; photo_url?: string }[] | null;
  const certificationsList = d.certifications as string[] | null;
  const mapQuery = doctor.address ? encodeURIComponent(`${doctor.address}, ${doctor.city}, ${doctor.state}`) : doctor.city ? encodeURIComponent(`${doctor.city}, ${doctor.state}`) : null;

  const trackEvent = (eventType: string) => {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctorId: doctor.id, eventType }),
    }).catch(() => {});
  };

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (data.session?.user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.session.user.id).single();
        setUserRole(profile?.role || null);
      }
    };
    fetchSession();
    getApprovedStories(doctor.id).then(setStories);
  }, [supabase, doctor.id]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: name, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-dvh bg-neuro-cream pb-40">
      {/* Hero with Banner */}
      <section className={`text-white pt-20 sm:pt-28 pb-10 sm:pb-16 px-6 relative overflow-hidden ${bannerUrl ? '' : 'bg-neuro-navy'}`}>
        {bannerUrl && (
          <div className="absolute inset-0">
            <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-neuro-navy/80" />
          </div>
        )}
        {!bannerUrl && (
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 left-20 w-60 h-60 bg-neuro-orange rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-20 w-40 h-40 bg-blue-500 rounded-full blur-3xl" />
          </div>
        )}
        <div className="max-w-4xl mx-auto relative z-10">
          <Link href="/directory" className="text-xs text-gray-400 hover:text-white transition-colors mb-6 inline-flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Back to Directory
          </Link>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mt-4">
            {/* Photo */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-2xl bg-white/10 overflow-hidden flex-shrink-0 shadow-2xl border-2 border-white/10 relative">
              {doctor.photo_url && !photoError ? (
                <img src={doctor.photo_url} alt={name} className="w-full h-full object-cover" onError={() => setPhotoError(true)} />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-white font-black text-3xl">{(doctor.first_name?.[0] || 'N').toUpperCase()}</span>
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-black text-white">{name}</h1>
              <div className="flex items-center gap-2 mt-1 justify-center sm:justify-start flex-wrap">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                {doctor.is_founding_member && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-neuro-orange/20 text-neuro-orange text-[9px] font-black rounded-full border border-neuro-orange/30 uppercase tracking-wider">
                    <Star className="w-3 h-3 fill-neuro-orange" /> Founding Member
                  </span>
                )}
              </div>
              <p className="text-gray-300 text-base sm:text-lg font-medium mt-1">{doctor.clinic_name || 'Private Practice'}</p>
              {location && (
                <div className="flex items-center gap-1.5 mt-1 text-gray-400 justify-center sm:justify-start">
                  <MapPin className="w-3.5 h-3.5 text-neuro-orange" />
                  <span className="text-sm">{location}</span>
                </div>
              )}

              {/* Social links */}
              <div className="flex items-center gap-2 mt-3 justify-center sm:justify-start">
                {!gated && instagramUrl && (
                  <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                    <Instagram className="w-4 h-4 text-white" />
                  </a>
                )}
                {!gated && facebookUrl && (
                  <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                    <Facebook className="w-4 h-4 text-white" />
                  </a>
                )}
                {!gated && formatUrl(doctor.website_url) && (
                  <a href={formatUrl(doctor.website_url)!} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                    <Globe className="w-4 h-4 text-white" />
                  </a>
                )}
                <button onClick={handleShare} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                  {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4 text-white" />}
                </button>
                <button onClick={() => toggleSave('doctors', doctor.id?.toString())} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                  <Heart className={`w-4 h-4 ${saved ? 'text-red-400 fill-red-400' : 'text-white'}`} />
                </button>
              </div>

              {/* Quick CTA — hidden on mobile (sticky bar handles it) */}
              <div className="hidden sm:flex items-center gap-3 mt-5">
                {gated ? (
                  <ContactGateCTA variant="hero" doctorId={doctor.id} doctorName={name} isClaimed={!!doctor.user_id} />
                ) : (
                  <>
                    {doctor.phone && (
                      <a href={`tel:${doctor.phone}`} onClick={() => trackEvent('phone_tap')}
                        className="px-6 py-3 bg-neuro-orange text-white font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-neuro-orange/90 transition-colors">
                        <Phone className="w-4 h-4" /> Call Now
                      </a>
                    )}
                    {bookingUrl ? (
                      <a href={bookingUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('booking_click')}
                        className="px-6 py-3 bg-green-500 text-white font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-green-600 transition-colors">
                        <Calendar className="w-4 h-4" /> Book Online
                      </a>
                    ) : (
                      <a href="#appointment" className="px-6 py-3 bg-white/10 text-white font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-white/20 transition-colors border border-white/20">
                        <Calendar className="w-4 h-4" /> Book Consultation
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      {(d.profile_views > 0 || specialties.length > 0) && (
        <div className="bg-neuro-navy border-t border-white/5 overflow-x-auto">
          <div className="max-w-4xl mx-auto flex justify-center divide-x divide-white/10 min-w-0">
            {yearsInPractice && (
              <div className="flex-1 text-center py-3 sm:py-4 px-2 min-w-0">
                <div className="text-xl sm:text-2xl font-black text-neuro-orange">{yearsInPractice}+</div>
                <div className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wider">Years Practice</div>
              </div>
            )}
            {d.profile_views > 0 && !gated && (
              <div className="flex-1 text-center py-3 sm:py-4 px-2 min-w-0">
                <div className="text-xl sm:text-2xl font-black text-neuro-orange">{d.profile_views > 999 ? `${(d.profile_views / 1000).toFixed(1)}k` : d.profile_views}</div>
                <div className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wider">Views</div>
              </div>
            )}
            {specialties.length > 0 && (
              <div className="flex-1 text-center py-3 sm:py-4 px-2 min-w-0">
                <div className="text-xl sm:text-2xl font-black text-neuro-orange">{specialties.length}</div>
                <div className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wider">Specialties</div>
              </div>
            )}
            {d.patient_leads > 0 && (
              <div className="flex-1 text-center py-3 sm:py-4 px-2 min-w-0">
                <div className="text-xl sm:text-2xl font-black text-neuro-orange">{d.patient_leads}</div>
                <div className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wider">Inquiries</div>
              </div>
            )}
            {location && (
              <div className="flex-1 text-center py-3 sm:py-4 px-2 min-w-0">
                <div className="text-lg sm:text-2xl font-black text-neuro-orange truncate">{doctor.city}</div>
                <div className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wider truncate">{doctor.state}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Badges */}
      {(acceptingNewPatients || offersTelehealth || acceptsWalkins) && (
        <div className="bg-neuro-navy border-t border-white/5">
          <div className="max-w-4xl mx-auto flex justify-center gap-3 py-3 px-6 flex-wrap">
            {acceptingNewPatients && <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/30">Accepting New Patients</span>}
            {offersTelehealth && <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full border border-blue-500/30">Telehealth Available</span>}
            {acceptsWalkins && <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-full border border-purple-500/30">Walk-Ins Welcome</span>}
          </div>
        </div>
      )}

      {/* Claim Banner */}
      {!doctor.user_id && (
        <div className="max-w-4xl mx-auto px-6 mt-6">
          <div className="bg-gradient-to-r from-neuro-navy to-[#1a3048] rounded-2xl p-6 text-white">
            <p className="font-black text-lg mb-1">Welcome, {name}!</p>
            <p className="text-white/70 text-sm leading-relaxed mb-4">We built this free listing for you based on your public practice info. Claim it to manage your profile — takes 15 seconds. Your free plan includes your name, specialties, and location. Upgrade anytime to show your photo and contact info to patients.</p>
            <a href={`/register?claim_id=${doctor.id}&role=doctor`}
              className="inline-block px-6 py-3 bg-neuro-orange text-white rounded-xl text-sm font-bold hover:bg-neuro-orange/90 transition-all shadow-lg shadow-neuro-orange/20">
              Claim My Profile
            </a>
          </div>
        </div>
      )}

      {/* Owner Upgrade Banner — only shows when doctor views their own gated profile */}
      {gated && session?.user?.id && doctor.user_id === session.user.id && (
        <div className="max-w-4xl mx-auto px-6 mt-6">
          <div className="bg-gradient-to-r from-neuro-orange/10 to-neuro-orange/5 border border-neuro-orange/20 rounded-2xl p-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="font-black text-neuro-navy text-sm">This is how patients see your profile</p>
                <p className="text-xs text-gray-500 mt-1">Your phone, website, booking link, and photo are hidden. Upgrade to Pro so patients can reach you.</p>
              </div>
              <Link href="/doctor/billing"
                className="px-5 py-2.5 bg-neuro-orange text-white rounded-xl text-sm font-bold hover:bg-neuro-orange/90 transition-all whitespace-nowrap shadow-lg shadow-neuro-orange/20">
                Upgrade to Pro — $49/mo
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <section className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Specialties */}
            {specialties.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Stethoscope className="w-5 h-5 text-neuro-orange" />
                  <h2 className="text-lg font-black text-neuro-navy">Specialties</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {specialties.map((s: string, i: number) => (
                    <span key={i} className="px-4 py-2 bg-neuro-orange/5 text-neuro-orange text-sm font-bold rounded-xl border border-neuro-orange/10">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {certificationsList && certificationsList.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-neuro-orange" />
                  <h2 className="text-lg font-black text-neuro-navy">Certifications</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {certificationsList.map((c: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-100">{c}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Badges */}
            {doctor.user_id && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <PublicBadges doctorUserId={doctor.user_id} />
              </div>
            )}

            {/* Bio */}
            {doctor.bio && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                <h2 className="text-lg font-black text-neuro-navy mb-4">About {name}</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{doctor.bio}</p>
              </div>
            )}

            {/* Why Choose Me / Highlights */}
            {highlights && highlights.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                <div className="flex items-center gap-2 mb-5">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <h2 className="text-lg font-black text-neuro-navy">Why Choose {doctor.first_name}?</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {highlights.map((h: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 bg-green-50/50 rounded-xl p-4 border border-green-100">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Patients We Help */}
            {conditionsTreated && conditionsTreated.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                <h2 className="text-lg font-black text-neuro-navy mb-4">Patients We Help</h2>
                <div className="flex flex-wrap gap-2">
                  {conditionsTreated.map((c: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Spotlight / Video */}
            {spotlightEpisode && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-2 px-6 pt-5 pb-3">
                  <span className="text-lg">🎬</span>
                  <h2 className="text-lg font-black text-neuro-navy">Featured on NeuroChiro Spotlight</h2>
                  <span className="bg-neuro-orange/10 text-neuro-orange text-xs font-black px-2.5 py-0.5 rounded-full">EP {String(spotlightEpisode.episodeNumber).padStart(2, "0")}</span>
                </div>
                <div className="px-6 pb-3">
                  <p className="text-gray-500 text-sm italic">&ldquo;{spotlightEpisode.quote}&rdquo;</p>
                </div>
                <div className="aspect-video">
                  <iframe src={spotlightEpisode.videoUrl} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                </div>
                <div className="px-6 py-4">
                  <p className="text-gray-500 text-sm mb-3">{spotlightEpisode.description}</p>
                  <Link href="/spotlight" className="text-neuro-orange font-bold text-sm hover:underline">Watch all Spotlight episodes &rarr;</Link>
                </div>
              </div>
            )}

            {doctor.video_url && !spotlightEpisode && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="aspect-video">
                  <iframe src={doctor.video_url.replace('watch?v=', 'embed/').replace('vimeo.com/', 'player.vimeo.com/video/')}
                    className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                </div>
              </div>
            )}

            {/* First Visit Info */}
            {firstVisitInfo && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                <h2 className="text-lg font-black text-neuro-navy mb-4">What to Expect on Your First Visit</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{firstVisitInfo}</p>
              </div>
            )}

            {/* Amenities */}
            {amenitiesList && amenitiesList.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                <h2 className="text-lg font-black text-neuro-navy mb-4">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {amenitiesList.map((a: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 bg-gray-50 text-gray-700 text-sm rounded-lg border border-gray-100">{a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Team Members */}
            {teamMembersList && teamMembersList.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-neuro-orange" />
                  <h2 className="text-lg font-black text-neuro-navy">Our Team</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {teamMembersList.map((m, i) => (
                    <div key={i} className="text-center">
                      <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden mx-auto mb-2">
                        {m.photo_url ? <img src={m.photo_url} alt={m.name} className="w-full h-full object-cover" /> :
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl font-bold">{m.name?.[0]}</div>}
                      </div>
                      <p className="text-sm font-bold text-neuro-navy">{m.name}</p>
                      <p className="text-xs text-gray-500">{m.role}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photo Gallery */}
            {galleryImages && galleryImages.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                <h2 className="text-lg font-black text-neuro-navy mb-4">Photos</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {galleryImages.map((img: string, i: number) => (
                    <img key={i} src={img} alt="" className="w-full aspect-video object-cover rounded-xl" />
                  ))}
                </div>
              </div>
            )}

            {/* Map */}
            {mapQuery && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-neuro-orange" />
                  <h2 className="text-lg font-black text-neuro-navy">Location</h2>
                </div>
                {doctor.address && <p className="text-sm text-gray-500 mb-4">{doctor.address}, {doctor.city}, {doctor.state} {doctor.zip_code}</p>}
                <div className="aspect-video rounded-xl overflow-hidden border border-gray-200">
                  <iframe src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                    className="w-full h-full" loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" />
                </div>
              </div>
            )}

            {/* Seminars */}
            {seminars.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                <h2 className="text-lg font-black text-neuro-navy mb-4">Seminars & Events</h2>
                <div className="space-y-3">
                  {seminars.map((sem: any) => (
                    <Link key={sem.id} href={`/seminars/${sem.id}`} className="block bg-gray-50 hover:bg-orange-50 rounded-xl p-4 transition-colors group">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-neuro-navy group-hover:text-neuro-orange transition-colors">{sem.title}</h3>
                          <div className="flex items-center gap-3 mt-1.5">
                            {sem.dates && <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> {sem.dates}</span>}
                            {(sem.city || sem.location) && <span className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {sem.city || sem.location}</span>}
                          </div>
                        </div>
                        {sem.price ? <span className="text-xs font-bold text-neuro-orange">${sem.price}</span> : <span className="text-xs font-bold text-green-600">Free</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Jobs */}
            {jobs.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                <h2 className="text-lg font-black text-neuro-navy mb-4">Open Positions</h2>
                <div className="space-y-3">
                  {jobs.map((job: any) => (
                    <Link key={job.id} href={`/careers/${job.id}`} className="block bg-gray-50 hover:bg-orange-50 rounded-xl p-4 transition-colors group">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-neuro-navy group-hover:text-neuro-orange transition-colors">{job.title}</h3>
                          <div className="flex items-center gap-3 mt-1.5">
                            {job.employment_type && <span className="text-xs text-gray-500">{job.employment_type}</span>}
                            {(job.salary_min || job.salary_max) && (
                              <span className="text-xs text-gray-500">
                                {job.salary_min && job.salary_max ? `$${(job.salary_min/1000).toFixed(0)}k–$${(job.salary_max/1000).toFixed(0)}k` : job.salary_min ? `From $${(job.salary_min/1000).toFixed(0)}k` : `Up to $${(job.salary_max/1000).toFixed(0)}k`}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Hiring</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Google Reviews */}
            {doctor.google_place_id && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                <h2 className="text-lg font-black text-neuro-navy mb-4">Reviews</h2>
                <GoogleReviews placeId={doctor.google_place_id} doctorName={name} />
              </div>
            )}

            {/* Patient Stories */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
              <h2 className="text-lg font-black text-neuro-navy mb-4">Patient Stories</h2>
              {stories.length > 0 ? (
                <div className="space-y-4 mb-6">
                  {stories.map((story) => (
                    <div key={story.id} className="bg-gray-50 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-bold text-neuro-navy">{story.patient_first_name}</span>
                        <span className="text-xs text-gray-400">{story.condition_before} &rarr; {story.outcome_after}</span>
                      </div>
                      <p className="text-gray-600 text-sm italic">&ldquo;{story.story_text}&rdquo;</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm mb-6">No stories yet. Be the first to share your experience.</p>
              )}
              {storySubmitted ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-1" />
                  <p className="font-bold text-green-700 text-sm">Thank you! Your story will appear after review.</p>
                </div>
              ) : showStoryForm ? (
                <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                  <input type="text" placeholder="Your first name" value={storyForm.patientFirstName} onChange={e => setStoryForm(f => ({...f, patientFirstName: e.target.value}))} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-neuro-orange" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Condition before" value={storyForm.conditionBefore} onChange={e => setStoryForm(f => ({...f, conditionBefore: e.target.value}))} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-neuro-orange" />
                    <input type="text" placeholder="Outcome after" value={storyForm.outcomeAfter} onChange={e => setStoryForm(f => ({...f, outcomeAfter: e.target.value}))} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-neuro-orange" />
                  </div>
                  <textarea placeholder="Tell your story..." value={storyForm.storyText} onChange={e => setStoryForm(f => ({...f, storyText: e.target.value}))} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-neuro-orange h-24 resize-none" />
                  <div className="flex gap-3">
                    <button onClick={() => setShowStoryForm(false)} className="px-4 py-2 text-gray-500 text-sm font-bold">Cancel</button>
                    <button disabled={submittingStory || !storyForm.patientFirstName || !storyForm.storyText}
                      onClick={async () => { setSubmittingStory(true); const result = await submitPatientStory(doctor.id, storyForm); setSubmittingStory(false); if (result.success) { setStorySubmitted(true); setShowStoryForm(false); } }}
                      className="px-4 py-2 bg-neuro-orange text-white rounded-xl text-sm font-bold hover:bg-neuro-orange/90 disabled:opacity-50">
                      {submittingStory ? 'Submitting...' : 'Submit'}
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowStoryForm(true)} className="text-sm font-bold text-neuro-orange hover:underline">Share your experience</button>
              )}
            </div>

            {/* FAQ */}
            {faq && faq.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                <h2 className="text-lg font-black text-neuro-navy mb-4">Frequently Asked Questions</h2>
                <div className="space-y-2">
                  {faq.map((item, i) => (
                    <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                      <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <span className="font-bold text-neuro-navy text-sm">{item.question}</span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                      </button>
                      {openFaq === i && (
                        <div className="px-4 pb-4"><p className="text-sm text-gray-600 leading-relaxed">{item.answer}</p></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24 space-y-5">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Quick Info</h3>

              {/* Contact Buttons */}
              <div className="space-y-2">
                {gated ? (
                  <ContactGateCTA variant="sidebar" doctorId={doctor.id} doctorName={name} isClaimed={!!doctor.user_id} />
                ) : (
                  <>
                    {doctor.phone && (
                      <a href={`tel:${doctor.phone}`} onClick={() => trackEvent('phone_tap')}
                        className="w-full py-3 bg-neuro-orange text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-neuro-orange/90 transition-colors">
                        <Phone className="w-4 h-4" /> Call {doctor.phone}
                      </a>
                    )}
                    {formatUrl(doctor.website_url) && (
                      <a href={formatUrl(doctor.website_url)!} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('website_click')}
                        className="w-full py-3 bg-neuro-navy text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-neuro-navy/90 transition-colors">
                        <Globe className="w-4 h-4" /> Visit Website
                      </a>
                    )}
                    {doctor.email && (
                      <a href={`mailto:${doctor.email}`} onClick={() => trackEvent('contact_click')}
                        className="w-full py-3 bg-gray-100 text-neuro-navy font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
                        <Mail className="w-4 h-4" /> Email
                      </a>
                    )}
                  </>
                )}
              </div>

              {/* Location */}
              {location && (
                <div className="flex items-start gap-3 pt-3 border-t border-gray-100">
                  <MapPin className="w-5 h-5 text-neuro-orange mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-neuro-navy text-sm">{doctor.clinic_name}</p>
                    <p className="text-xs text-gray-500">{doctor.address ? `${doctor.address}, ` : ''}{location}</p>
                  </div>
                </div>
              )}

              {/* Education */}
              {education && education.length > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <GraduationCap className="w-4 h-4 text-neuro-orange" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Education</span>
                  </div>
                  {education.map((e: string, i: number) => (
                    <p key={i} className="text-sm text-gray-600">{e}</p>
                  ))}
                </div>
              )}

              {/* Hours */}
              {hours && (
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-neuro-orange" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Hours</span>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{hours}</p>
                </div>
              )}

              {/* Languages */}
              {languages && languages.length > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Languages</p>
                  <div className="flex flex-wrap gap-1">
                    {languages.map((l: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-lg">{l}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment */}
              {acceptedPayment && acceptedPayment.length > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Accepted Payment</p>
                  <div className="flex flex-wrap gap-1">
                    {acceptedPayment.map((p: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-100">{p}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Insurance Networks */}
              {insuranceNetworks && insuranceNetworks.length > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Insurance Accepted</p>
                  <div className="flex flex-wrap gap-1">
                    {insuranceNetworks.map((ins: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg border border-blue-100">{ins}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Parking & Access */}
              {parkingInfo && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Parking & Access</p>
                  <p className="text-sm text-gray-600">{parkingInfo}</p>
                </div>
              )}

              {/* Refer (doctor only) */}
              {session && userRole === 'doctor' && doctor.user_id !== session.user.id && (
                <button onClick={() => setShowReferralModal(true)}
                  className="w-full py-3 bg-blue-50 text-blue-600 font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors">
                  <Users className="w-4 h-4" /> Refer a Patient
                </button>
              )}

              <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Verified NeuroChiro member
              </p>
            </div>
          </div>
        </div>

        {/* Request Appointment */}
        <div id="appointment" className="mt-8 bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
          <h2 className="text-lg font-black text-neuro-navy mb-2 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-neuro-orange" /> Request a Consultation
          </h2>
          {gated ? (
            <div className="text-center py-6">
              <ContactGateCTA variant="sidebar" doctorId={doctor.id} doctorName={name} isClaimed={!!doctor.user_id} />
            </div>
          ) : (
            <>
              <p className="text-gray-400 text-sm mb-5">Send a request to {doctor.clinic_name || name}. They&apos;ll get back to you directly.</p>
              {appointmentSubmitted ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-1" />
                  <p className="font-bold text-green-700 text-sm">Request Sent!</p>
                  <p className="text-green-600 text-xs mt-1">They&apos;ll contact you within 1-2 business days.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Your name *" value={appointmentForm.name} onChange={e => setAppointmentForm(f => ({...f, name: e.target.value}))} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-neuro-orange" />
                    <input type="email" placeholder="Email *" value={appointmentForm.email} onChange={e => setAppointmentForm(f => ({...f, email: e.target.value}))} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-neuro-orange" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="tel" placeholder="Phone (optional)" value={appointmentForm.phone} onChange={e => setAppointmentForm(f => ({...f, phone: e.target.value}))} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-neuro-orange" />
                    <input type="date" value={appointmentForm.preferredDate} onChange={e => setAppointmentForm(f => ({...f, preferredDate: e.target.value}))} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-neuro-orange" />
                  </div>
                  <textarea placeholder="What are you looking for? (optional)" value={appointmentForm.message} onChange={e => setAppointmentForm(f => ({...f, message: e.target.value}))} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-neuro-orange h-20 resize-none" />
                  <button disabled={submittingAppointment || !appointmentForm.name || !appointmentForm.email}
                    onClick={async () => {
                      setSubmittingAppointment(true);
                      try {
                        const res = await fetch('/api/appointment', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ patientName: appointmentForm.name, patientEmail: appointmentForm.email, patientPhone: appointmentForm.phone, preferredDate: appointmentForm.preferredDate, message: appointmentForm.message, doctorId: doctor.id }) });
                        if (!res.ok) throw new Error();
                        setAppointmentSubmitted(true);
                      } catch { alert('Something went wrong. Please try again or call the office directly.'); }
                      setSubmittingAppointment(false);
                    }}
                    className="w-full py-3 bg-neuro-orange text-white rounded-xl font-bold text-sm hover:bg-neuro-orange/90 disabled:opacity-50 flex items-center justify-center gap-2">
                    {submittingAppointment ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send Request</>}
                  </button>
                  <p className="text-xs text-gray-400 text-center">Your info is sent directly to the doctor. We never share it with anyone else.</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Report + Disclaimer */}
        <div className="mt-6 text-center space-y-4 pb-6">
          {reportSubmitted ? (
            <p className="text-sm text-green-600 font-bold">Thank you. Our team will review this.</p>
          ) : showReportForm ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 text-left">
              <h4 className="font-bold text-neuro-navy mb-1 text-sm">Report a Concern</h4>
              <p className="text-gray-400 text-xs mb-3">All reports are reviewed by our team.</p>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const data = new FormData(form);
                await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: data.get('email'), first_name: data.get('name'), source: 'report_concern', role: 'report', doctor_id: doctor.id, metadata: { concern: data.get('concern') } }) });
                setReportSubmitted(true);
              }} className="space-y-2">
                <input type="text" name="name" required placeholder="Your name" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-neuro-orange" />
                <input type="email" name="email" required placeholder="Your email" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-neuro-orange" />
                <textarea name="concern" required placeholder="Describe your concern..." rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-neuro-orange resize-none" />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowReportForm(false)} className="px-3 py-2 text-gray-500 text-xs font-bold">Cancel</button>
                  <button type="submit" className="px-3 py-2 bg-red-500 text-white text-xs font-bold rounded-lg">Submit Report</button>
                </div>
              </form>
            </div>
          ) : (
            <button onClick={() => setShowReportForm(true)} className="text-xs text-gray-400 hover:text-red-500 transition-colors underline">Report a concern</button>
          )}
          <p className="text-[11px] text-gray-400 leading-relaxed max-w-lg mx-auto">
            NeuroChiro is a directory service. The &ldquo;Verified&rdquo; badge indicates identity review, not a guarantee of clinical outcomes.{" "}
            <a href="/terms" className="underline">Terms</a> &middot; <a href="/privacy" className="underline">Privacy</a>
          </p>
        </div>
      </section>

      {/* Referral Modal */}
      {showReferralModal && (
        <>
          <div onClick={() => setShowReferralModal(false)} className="fixed inset-0 z-[500] bg-black/60" />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[501] w-full max-w-md p-6">
            <div className="bg-white rounded-2xl p-6 shadow-2xl">
              {referralSent ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h3 className="text-lg font-black text-neuro-navy">Referral Sent!</h3>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-black text-neuro-navy mb-4">Refer a Patient to {name}</h3>
                  <div className="space-y-3">
                    <input type="text" value={referralPatientName} onChange={e => setReferralPatientName(e.target.value)} placeholder="Patient name (optional)" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-neuro-orange" />
                    <textarea value={referralNotes} onChange={e => setReferralNotes(e.target.value)} placeholder="Notes (optional)" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-neuro-orange h-20 resize-none" />
                    <div className="flex gap-3">
                      <button onClick={() => setShowReferralModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-500 text-sm">Cancel</button>
                      <button onClick={async () => {
                        setReferring(true);
                        try { await sendReferral(doctor.id, referralPatientName || undefined, referralNotes || undefined); setReferralSent(true);
                          setTimeout(() => { setShowReferralModal(false); setReferralSent(false); setReferralPatientName(''); setReferralNotes(''); }, 2000);
                        } catch (err: any) { alert(err.message || 'Failed'); }
                        setReferring(false);
                      }} disabled={referring} className="flex-1 py-3 bg-neuro-orange text-white rounded-xl font-bold text-sm disabled:opacity-50">
                        {referring ? 'Sending...' : 'Send Referral'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Sticky mobile bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-200 py-3 px-4 z-[100] lg:hidden">
        <div className="flex gap-3 max-w-3xl mx-auto">
          {gated ? (
            <ContactGateCTA variant="mobile" doctorId={doctor.id} doctorName={name} isClaimed={!!doctor.user_id} />
          ) : (
            <>
              {bookingUrl ? (
                <a href={bookingUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('booking_click')} className="flex-1 py-3.5 bg-green-500 text-white rounded-xl font-bold text-sm text-center">
                  Book Online
                </a>
              ) : (
                <a href="#appointment" className="flex-1 py-3.5 bg-neuro-orange text-white rounded-xl font-bold text-sm text-center">
                  Book Consultation
                </a>
              )}
              {doctor.phone && (
                <a href={`tel:${doctor.phone}`} onClick={() => trackEvent('phone_tap')} className="flex-1 py-3.5 bg-neuro-navy text-white rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" /> Call
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
