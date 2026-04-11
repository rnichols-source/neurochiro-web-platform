"use client";

import { useState, useEffect } from "react";
import {
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Mail,
  ExternalLink,
  MessageSquare,
  Loader2,
  Phone,
  Heart,
  Share2,
  Calendar,
  Send,
  Globe,
  Users,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { useUserPreferences } from "@/context/UserPreferencesContext";
import { sendReferral } from "@/app/actions/referrals";
import { submitPatientStory, getApprovedStories } from "@/app/actions/patient-stories";
import GoogleReviews from "@/components/directory/GoogleReviews";
import Image from "next/image";

export default function DoctorProfileClient({ doctor, slug }: { doctor: any, slug: string }) {
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
  const supabase = createClient();

  const saved = isSaved('doctors', doctor.id?.toString());
  const name = `Dr. ${doctor.first_name || ''} ${doctor.last_name || ''}`.trim();

  const trackEvent = (eventType: string) => {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctorId: doctor.id, eventType }),
    }).catch(() => {});
  };
  const location = [doctor.city, doctor.state].filter(Boolean).join(", ");
  const specialties = doctor.specialties || [];

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
    <div className="min-h-dvh bg-white pb-32">
      {/* Header */}
      <div className="bg-neuro-navy pt-24 pb-6 px-6">
        <div className="max-w-3xl mx-auto">
          <Link href="/directory" className="text-xs text-gray-400 hover:text-white transition-colors mb-4 inline-block">&larr; Back to Directory</Link>
        </div>
      </div>

      {/* Profile Card */}
      <div className="max-w-3xl mx-auto px-6 -mt-2">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 md:p-8 relative">
          {/* Save & Share */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button onClick={handleShare} className="p-2 rounded-full hover:bg-gray-100 transition-colors" aria-label="Share profile">
              <Share2 className={`w-5 h-5 ${copied ? 'text-green-500' : 'text-gray-400'}`} />
            </button>
            <button
              onClick={() => {
                toggleSave('doctors', doctor.id?.toString());
              }}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label={saved ? "Unsave" : "Save"}
            >
              <Heart className={`w-5 h-5 ${saved ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
            </button>
          </div>

          {/* Doctor Info */}
          <div className="flex items-start gap-5 mb-6">
            <div className="w-20 h-20 rounded-xl bg-neuro-navy overflow-hidden flex-shrink-0 flex items-center justify-center shadow-md">
              {doctor.photo_url ? (
                <Image src={doctor.photo_url} alt={name} fill className="object-cover" priority />
              ) : (
                <span className="text-white font-black text-3xl">{(doctor.first_name?.[0] || 'N').toUpperCase()}</span>
              )}
            </div>
            <div className="pt-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-black text-neuro-navy">{name}</h1>
                <ShieldCheck className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-gray-500 text-sm font-medium">{doctor.clinic_name || 'Private Practice'}</p>
              {location && (
                <div className="flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-sm text-gray-400">{location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Specialties */}
          {specialties.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {specialties.map((s: string, i: number) => (
                <span key={i} className="px-3 py-1.5 bg-neuro-orange/5 text-neuro-orange text-xs font-bold rounded-lg border border-neuro-orange/10">
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* Contact Buttons */}
          <div className="flex gap-3 mb-6">
            {doctor.phone && (
              <a href={`tel:${doctor.phone}`} onClick={() => trackEvent('phone_tap')} className="flex-1 py-3 bg-neuro-orange text-white font-bold rounded-xl text-sm text-center flex items-center justify-center gap-2 hover:bg-neuro-orange/90 transition-colors">
                <Phone className="w-4 h-4" /> Call
              </a>
            )}
            {doctor.website_url && (
              <a href={doctor.website_url} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('website_click')} className="flex-1 py-3 bg-neuro-navy text-white font-bold rounded-xl text-sm text-center flex items-center justify-center gap-2 hover:bg-neuro-navy/90 transition-colors">
                <Globe className="w-4 h-4" /> Website
              </a>
            )}
            {doctor.email && (
              <a href={`mailto:${doctor.email}`} onClick={() => trackEvent('contact_click')} className="flex-1 py-3 bg-gray-100 text-neuro-navy font-bold rounded-xl text-sm text-center flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
                <Mail className="w-4 h-4" /> Email
              </a>
            )}
          </div>

          {/* Incomplete profile notice */}
          {!doctor.bio && !doctor.phone && !doctor.website_url && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4">
              <p className="text-xs text-gray-500 text-center">This doctor is new to NeuroChiro and is still setting up their profile.</p>
            </div>
          )}

          {/* Refer Button (doctor-to-doctor only) */}
          {session && userRole === 'doctor' && doctor.user_id !== session.user.id && (
            <button onClick={() => setShowReferralModal(true)} className="w-full py-3 bg-blue-50 text-blue-600 font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors mb-6">
              <Users className="w-4 h-4" /> Refer a Patient
            </button>
          )}
        </div>

        {/* Bio */}
        {doctor.bio && (
          <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
            <h2 className="text-lg font-black text-neuro-navy mb-3">About</h2>
            <p className="text-gray-600 leading-relaxed">{doctor.bio}</p>
          </div>
        )}

        {/* Video */}
        {doctor.video_url && (
          <div className="mt-6 bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="aspect-video">
              <iframe
                src={doctor.video_url.replace('watch?v=', 'embed/').replace('vimeo.com/', 'player.vimeo.com/video/')}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Google Reviews */}
        {doctor.google_place_id && (
          <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
            <h2 className="text-lg font-black text-neuro-navy mb-4">Reviews</h2>
            <GoogleReviews placeId={doctor.google_place_id} doctorName={name} />
          </div>
        )}

        {/* Patient Stories */}
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
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
                <button
                  disabled={submittingStory || !storyForm.patientFirstName || !storyForm.storyText}
                  onClick={async () => {
                    setSubmittingStory(true);
                    const result = await submitPatientStory(doctor.id, storyForm);
                    setSubmittingStory(false);
                    if (result.success) { setStorySubmitted(true); setShowStoryForm(false); }
                  }}
                  className="px-4 py-2 bg-neuro-orange text-white rounded-xl text-sm font-bold hover:bg-neuro-orange/90 disabled:opacity-50"
                >
                  {submittingStory ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowStoryForm(true)} className="text-sm font-bold text-neuro-orange hover:underline">
              Share your experience
            </button>
          )}
        </div>

        {/* Request Appointment */}
        <div id="appointment" className="mt-6 bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
          <h2 className="text-lg font-black text-neuro-navy mb-2 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-neuro-orange" /> Request an Appointment
          </h2>
          <p className="text-gray-400 text-sm mb-5">Send a request to {doctor.clinic_name || name}. They&apos;ll get back to you directly.</p>

          {appointmentSubmitted ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-1" />
              <p className="font-bold text-green-700 text-sm">Request Sent!</p>
              <p className="text-green-600 text-xs mt-1">They&apos;ll contact you within 1-2 business days at the email you provided.</p>
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
              <button
                disabled={submittingAppointment || !appointmentForm.name || !appointmentForm.email}
                onClick={async () => {
                  setSubmittingAppointment(true);
                  try {
                    await fetch('/api/appointment', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        patientName: appointmentForm.name,
                        patientEmail: appointmentForm.email,
                        patientPhone: appointmentForm.phone,
                        preferredDate: appointmentForm.preferredDate,
                        message: appointmentForm.message,
                        doctorId: doctor.id,
                      }),
                    });
                    setAppointmentSubmitted(true);
                  } catch { setAppointmentSubmitted(true); }
                  setSubmittingAppointment(false);
                }}
                className="w-full py-3 bg-neuro-orange text-white rounded-xl font-bold text-sm hover:bg-neuro-orange/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submittingAppointment ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send Request</>}
              </button>
              <p className="text-xs text-gray-400 text-center">Your info is sent directly to the doctor. We never share it with anyone else.</p>
            </div>
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
                await fetch('/api/leads', {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: data.get('email'), first_name: data.get('name'), source: 'report_concern', role: 'report', doctor_id: doctor.id, location: `Report: ${data.get('concern')}` }),
                });
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
            <button onClick={() => setShowReportForm(true)} className="text-xs text-gray-400 hover:text-red-500 transition-colors underline">
              Report a concern about this doctor
            </button>
          )}
          <p className="text-[11px] text-gray-400 leading-relaxed max-w-lg mx-auto">
            NeuroChiro is a directory service. The &ldquo;Verified Clinician&rdquo; badge indicates identity review, not a guarantee of clinical outcomes.{" "}
            <a href="/terms" className="underline">Terms</a> &middot; <a href="/privacy" className="underline">Privacy</a>
          </p>
        </div>
      </div>

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
                        try {
                          await sendReferral(doctor.id, referralPatientName || undefined, referralNotes || undefined);
                          setReferralSent(true);
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
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 px-4 z-40 lg:hidden">
        <div className="flex gap-3 max-w-3xl mx-auto">
          {doctor.website_url ? (
            <a
              href={doctor.website_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('booking_click')}
              className="flex-1 py-3 bg-neuro-orange text-white rounded-xl font-bold text-sm text-center"
            >
              Visit Website
            </a>
          ) : (
            <a
              href="#appointment"
              className="flex-1 py-3 bg-neuro-orange text-white rounded-xl font-bold text-sm text-center"
            >
              Request Appointment
            </a>
          )}
          {doctor.phone && (
            <a href={`tel:${doctor.phone}`} onClick={() => trackEvent('phone_tap')} className="flex-1 py-3 bg-neuro-navy text-white rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2">
              <Phone className="w-4 h-4" /> Call
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
