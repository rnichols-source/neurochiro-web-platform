"use client";

import * as React from "react";
import { useEffect, useState, useMemo } from "react";
import {
  Calendar, MapPin, ArrowLeft, Loader2, ExternalLink, Users, Clock,
  Award, HelpCircle, Image as ImageIcon, ChevronDown, Share2, Copy,
  Check, Plane, Hotel, Sun, Mic2, CheckCircle2, ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { getSeminarById, getSeminars, incrementSeminarStats } from "../actions";
import Footer from "@/components/landing/Footer";
import SeminarReviews from "./seminar-reviews";

/* ─── Countdown Hook ─── */
function useCountdown(targetDate: Date) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, targetDate.getTime() - now.getTime());
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    isPast: diff === 0,
  };
}

/* ─── Parse event start date from dates string ─── */
function parseEventDate(dates: string): Date | null {
  // Try "November 5-8, 2026" pattern
  const m = dates.match(/(\w+)\s+(\d+).*?,\s*(\d{4})/);
  if (m) return new Date(`${m[1]} ${m[2]}, ${m[3]}`);
  return null;
}

export default function SeminarDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [seminar, setSeminar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [expandedSpeaker, setExpandedSpeaker] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [relatedSeminars, setRelatedSeminars] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await getSeminarById(id);
        setSeminar(data);
      } catch (e) {
        console.error("Failed to load seminar:", e);
      }
      setLoading(false);

      // Track views (non-blocking)
      try { if (id) await incrementSeminarStats(id, "page_views"); } catch {}

      // Load related seminars (non-blocking)
      try {
        const all = await getSeminars({});
        setRelatedSeminars((all || []).filter((s: any) => s.id !== id).slice(0, 3));
      } catch {}
    }
    load();
  }, [id]);

  const eventDate = useMemo(() => {
    try { return seminar?.dates ? parseEventDate(seminar.dates) : null; } catch { return null; }
  }, [seminar?.dates]);
  const countdown = useCountdown(eventDate || new Date(Date.now() + 86400000));

  // Google Calendar link (must be before early returns — hooks can't be conditional)
  const calendarUrl = useMemo(() => {
    if (!eventDate || !seminar) return null;
    try {
      const va = (seminar as any).venue_address || '';
      const loc = [seminar.location, seminar.city, seminar.country].filter(Boolean).join(", ");
      const start = eventDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const end = new Date(eventDate.getTime() + 2 * 86400000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(seminar.title || '')}&dates=${start}/${end}&location=${encodeURIComponent(va || loc)}&details=${encodeURIComponent((seminar.description || '').slice(0, 200))}`;
    } catch { return null; }
  }, [eventDate, seminar]);

  // Sponsors extracted from schedule (must be before early returns)
  const sponsors = useMemo(() => {
    if (!seminar) return [];
    const sched = (seminar as any).schedule as { day: string; items: { time: string; title: string }[] }[] | null;
    if (!sched) return [];
    const found: { name: string; context: string }[] = [];
    sched.forEach((day: any) => {
      (day.items || []).forEach((item: any) => {
        const sponsorMatch = item.title?.match(/[Ss]ponsored by (.+)/);
        if (sponsorMatch) {
          found.push({ name: sponsorMatch[1], context: item.title });
        }
      });
    });
    return found;
  }, [seminar]);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      navigator.share({ title: seminar?.title, url: window.location.href }).catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-neuro-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neuro-orange" />
      </div>
    );
  }

  if (!seminar) {
    return (
      <div className="min-h-dvh bg-neuro-cream flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-black text-neuro-navy mb-4">Event Not Found</h1>
        <p className="text-gray-500 mb-6">This seminar doesn&apos;t exist or has been removed.</p>
        <Link href="/seminars" className="px-6 py-3 bg-neuro-orange text-white font-bold rounded-xl">Back to Seminars</Link>
      </div>
    );
  }

  const location = [seminar.location, seminar.city, seminar.country].filter(Boolean).join(", ");
  const s = seminar as any;
  const schedule = s.schedule as { day: string; items: { time: string; title: string; description?: string }[] }[] | null;
  const speakers = s.speakers as { name: string; title: string; photo_url?: string; bio?: string }[] | null;
  const faq = s.faq as { question: string; answer: string }[] | null;
  const galleryImages = s.gallery_images as string[] | null;
  const venueName = s.venue_name as string | null;
  const venueAddress = s.venue_address as string | null;
  const heroImage = s.hero_image_url as string | null;
  const spotlightVideoUrl = s.spotlight_video_url as string | null;
  const spotlightQuote = s.spotlight_quote as string | null;
  const spotlightHostName = s.spotlight_host_name as string | null;

  // Google Maps embed
  const mapQuery = venueAddress ? encodeURIComponent(venueAddress) : venueName ? encodeURIComponent(venueName) : null;

  // What's included
  const inclusions = [
    "All speaker sessions (Friday & Saturday)",
    "Poolside Q&A panel",
    "After-hours book signing",
    "Beach networking events",
    "Lunch both days (sponsored)",
    "Access to all after-hours events",
  ];

  // Who should attend
  const audiences = [
    { label: "Practice owners", desc: "Ready to scale and build systems" },
    { label: "Associate doctors", desc: "Looking to level up and lead" },
    { label: "Chiropractors in transition", desc: "Pivoting your career or practice model" },
    { label: "Students", desc: "Serious about building your future practice" },
  ];

  const handleRegisterClick = () => {
    incrementSeminarStats(id, "clicks").catch(() => {});
  };

  return (
    <div className="min-h-dvh bg-neuro-cream">
      {/* Hero */}
      <section className={`text-white pt-28 pb-14 px-6 relative overflow-hidden ${heroImage ? '' : 'bg-neuro-navy'}`}>
        {heroImage && (
          <div className="absolute inset-0">
            <img src={heroImage} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-neuro-navy/80" />
          </div>
        )}
        {!heroImage && (
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 left-20 w-60 h-60 bg-neuro-orange rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-20 w-40 h-40 bg-blue-500 rounded-full blur-3xl" />
          </div>
        )}
        <div className="max-w-4xl mx-auto relative z-10">
          <Link href="/seminars" className="text-xs text-gray-400 hover:text-white transition-colors mb-6 inline-flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> All Seminars
          </Link>

          <div className="flex flex-wrap items-center gap-3 mb-4 mt-4">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-1.5 rounded-lg">
              <Calendar className="w-4 h-4 text-neuro-orange" />
              <span className="text-sm font-bold">{seminar.dates}</span>
            </div>
            {location && (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-1.5 rounded-lg">
                <MapPin className="w-4 h-4 text-neuro-orange" />
                <span className="text-sm font-bold">{location}</span>
              </div>
            )}
            {s.ce_hours && (
              <div className="flex items-center gap-2 bg-blue-500/20 backdrop-blur px-3 py-1.5 rounded-lg">
                <Award className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-bold text-blue-300">{s.ce_hours} CE Hours</span>
              </div>
            )}
          </div>

          <h1 className="text-3xl md:text-5xl font-heading font-black text-white mb-4 leading-tight">
            {seminar.title}
          </h1>

          {seminar.instructor_name && (
            <p className="text-gray-300 text-lg">Hosted by {seminar.host_doctor ? (
              <Link href={`/directory/${seminar.host_doctor.slug}`} className="text-white font-bold hover:text-neuro-orange transition-colors underline underline-offset-2">
                {seminar.instructor_name}
              </Link>
            ) : (
              <span className="text-white font-bold">{seminar.instructor_name}</span>
            )}</p>
          )}

          {/* Register CTA + Share */}
          <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {seminar.registration_link && (
              <a
                href={seminar.registration_link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleRegisterClick}
                className="px-8 py-4 bg-neuro-orange text-white font-bold rounded-xl text-lg flex items-center gap-2 hover:bg-neuro-orange/90 transition-colors shadow-lg shadow-neuro-orange/20"
              >
                Register Now <ExternalLink className="w-5 h-5" />
              </a>
            )}
            {seminar.price != null && (
              <span className="text-2xl font-black text-white">
                {seminar.price > 0 ? `$${seminar.price}` : 'Free'}
                {seminar.price > 0 && <span className="text-sm font-normal text-gray-400 ml-1">per person</span>}
              </span>
            )}
            <div className="flex items-center gap-2">
              <button onClick={handleShare} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors" title="Share">
                <Share2 className="w-4 h-4 text-white" />
              </button>
              <button onClick={handleCopyLink} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors" title="Copy link">
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white" />}
              </button>
              {calendarUrl && (
                <a href={calendarUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors" title="Add to Google Calendar">
                  <Calendar className="w-4 h-4 text-white" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      {speakers && speakers.length > 0 && (
        <div className="bg-neuro-navy border-t border-white/5">
          <div className="max-w-4xl mx-auto flex justify-center divide-x divide-white/10">
            <div className="flex-1 text-center py-4">
              <div className="text-2xl font-black text-neuro-orange">{speakers.length}</div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Speakers</div>
            </div>
            {schedule && (
              <div className="flex-1 text-center py-4">
                <div className="text-2xl font-black text-neuro-orange">{schedule.filter(d => d.items.length > 2).length}</div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Days</div>
              </div>
            )}
            <div className="flex-1 text-center py-4">
              <div className="text-2xl font-black text-neuro-orange">{seminar.city || '---'}</div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Location</div>
            </div>
            {seminar.price != null && (
              <div className="flex-1 text-center py-4">
                <div className="text-2xl font-black text-neuro-orange">${seminar.price}</div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Per Person</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Countdown Timer */}
      {eventDate && !countdown.isPast && (
        <div className="bg-gradient-to-r from-neuro-orange to-orange-500 py-5 px-6">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            <p className="text-white font-bold text-sm uppercase tracking-wider">Event starts in</p>
            <div className="flex items-center gap-3">
              {[
                { value: countdown.days, label: "Days" },
                { value: countdown.hours, label: "Hours" },
                { value: countdown.minutes, label: "Min" },
                { value: countdown.seconds, label: "Sec" },
              ].map((unit) => (
                <div key={unit.label} className="text-center">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                    <span className="text-2xl font-black text-white">{String(unit.value).padStart(2, '0')}</span>
                  </div>
                  <span className="text-[9px] font-bold text-white/70 uppercase mt-1 block">{unit.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Spotlight Interview */}
      {spotlightVideoUrl && (
        <section className="bg-neuro-navy py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 bg-neuro-orange rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neuro-orange">NeuroChiro Spotlight</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
              <div className="lg:col-span-3">
                <div className="aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl">
                  {spotlightVideoUrl.includes('youtube.com') || spotlightVideoUrl.includes('youtu.be') ? (
                    <iframe
                      src={spotlightVideoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : spotlightVideoUrl.includes('vimeo.com') ? (
                    <iframe
                      src={spotlightVideoUrl.replace('vimeo.com/', 'player.vimeo.com/video/')}
                      className="w-full h-full"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video src={spotlightVideoUrl} controls className="w-full h-full object-cover" />
                  )}
                </div>
              </div>
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-heading font-black text-white mb-4">
                  Hear from {spotlightHostName || 'the Host'}
                </h2>
                {spotlightQuote && (
                  <blockquote className="text-gray-300 leading-relaxed italic mb-6 border-l-2 border-neuro-orange pl-4">
                    &ldquo;{spotlightQuote}&rdquo;
                  </blockquote>
                )}
                <p className="text-gray-500 text-sm mb-6">
                  Watch the full interview to learn why this event is a must-attend for nervous system chiropractors.
                </p>
                {seminar.registration_link && (
                  <a href={seminar.registration_link} target="_blank" rel="noopener noreferrer" onClick={handleRegisterClick}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors">
                    Register Now <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="max-w-4xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            {seminar.description && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                <h2 className="text-lg font-black text-neuro-navy mb-4">About This Event</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{seminar.description}</p>
              </div>
            )}

            {/* What's Included */}
            {seminar.price > 0 && (
              <div className="bg-white rounded-2xl border-2 border-green-200 p-6 md:p-8">
                <div className="flex items-center gap-2 mb-5">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <h2 className="text-lg font-black text-neuro-navy">What&apos;s Included in Your Ticket</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {inclusions.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      <span className="text-sm text-gray-600">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Who Should Attend */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
              <div className="flex items-center gap-2 mb-5">
                <Users className="w-5 h-5 text-neuro-orange" />
                <h2 className="text-lg font-black text-neuro-navy">Who Should Attend</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {audiences.map((a, i) => (
                  <div key={i} className="bg-neuro-orange/5 rounded-xl p-4 border border-neuro-orange/10">
                    <p className="font-bold text-neuro-navy text-sm">{a.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{a.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule */}
            {schedule && schedule.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                <div className="flex items-center gap-2 mb-6">
                  <Clock className="w-5 h-5 text-neuro-orange" />
                  <h2 className="text-lg font-black text-neuro-navy">Schedule</h2>
                </div>
                <div className="space-y-6">
                  {schedule.map((day, di) => (
                    <div key={di}>
                      <h3 className="text-sm font-black text-neuro-orange uppercase tracking-widest mb-3">{day.day}</h3>
                      <div className="space-y-3 border-l-2 border-neuro-orange/20 pl-4">
                        {day.items.map((item, ii) => (
                          <div key={ii}>
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-bold text-gray-400 w-20 shrink-0 pt-0.5">{item.time}</span>
                              <div>
                                <span className="text-sm font-bold text-neuro-navy">{item.title}</span>
                                {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Speakers */}
            {speakers && speakers.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                <div className="flex items-center gap-2 mb-6">
                  <Mic2 className="w-5 h-5 text-neuro-orange" />
                  <h2 className="text-lg font-black text-neuro-navy">Speakers ({speakers.length})</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {speakers.map((speaker, si) => {
                    const isExpanded = expandedSpeaker === si;
                    return (
                      <button
                        key={si}
                        onClick={() => setExpandedSpeaker(isExpanded ? null : si)}
                        className="flex items-start gap-4 bg-gray-50 hover:bg-gray-100 rounded-xl p-4 text-left transition-colors w-full"
                      >
                        {speaker.photo_url ? (
                          <img src={speaker.photo_url} alt={speaker.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-neuro-navy/10 flex items-center justify-center text-neuro-navy font-bold text-sm shrink-0">
                            {speaker.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-neuro-navy text-sm">{speaker.name}</p>
                          <p className="text-xs text-neuro-orange font-bold mt-0.5">{speaker.title}</p>
                          {speaker.bio && (
                            <p className={`text-xs text-gray-500 mt-1.5 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                              {speaker.bio}
                            </p>
                          )}
                          {speaker.bio && (
                            <span className="text-[10px] font-bold text-neuro-orange mt-1 inline-block">
                              {isExpanded ? 'Show less' : 'Read more'}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sponsors */}
            {sponsors.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                <div className="flex items-center gap-2 mb-5">
                  <Award className="w-5 h-5 text-neuro-orange" />
                  <h2 className="text-lg font-black text-neuro-navy">Event Sponsors</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sponsors.map((sp, i) => (
                    <div key={i} className="flex items-center gap-4 bg-neuro-orange/5 rounded-xl p-4 border border-neuro-orange/10">
                      <div className="w-12 h-12 rounded-xl bg-neuro-orange/10 flex items-center justify-center shrink-0">
                        <Award className="w-6 h-6 text-neuro-orange" />
                      </div>
                      <div>
                        <p className="font-bold text-neuro-navy text-sm">{sp.name}</p>
                        <p className="text-xs text-gray-500">{sp.context}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Venue + Map */}
            {(venueName || venueAddress) && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                <div className="flex items-center gap-2 mb-5">
                  <MapPin className="w-5 h-5 text-neuro-orange" />
                  <h2 className="text-lg font-black text-neuro-navy">Venue</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    {venueName && <p className="font-bold text-neuro-navy text-lg">{venueName}</p>}
                    {venueAddress && <p className="text-sm text-gray-500 mt-1">{venueAddress}</p>}
                  </div>
                  {mapQuery && (
                    <div className="aspect-video rounded-xl overflow-hidden border border-gray-200">
                      <iframe
                        src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                        className="w-full h-full"
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Travel Info */}
            {venueName && (
              <div className="bg-neuro-navy rounded-2xl p-6 md:p-8">
                <div className="flex items-center gap-2 mb-5">
                  <Plane className="w-5 h-5 text-neuro-orange" />
                  <h2 className="text-lg font-black text-white">Travel Info</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <Plane className="w-5 h-5 text-neuro-orange mb-2" />
                    <p className="font-bold text-white text-sm">Fly Into</p>
                    <p className="text-xs text-gray-400 mt-1">Fort Lauderdale-Hollywood International Airport (FLL) — 15 min from venue</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <Hotel className="w-5 h-5 text-neuro-orange mb-2" />
                    <p className="font-bold text-white text-sm">Stay At</p>
                    <p className="text-xs text-gray-400 mt-1">{venueName}. Book directly with the hotel — ask about group rates.</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <Sun className="w-5 h-5 text-neuro-orange mb-2" />
                    <p className="font-bold text-white text-sm">Weather</p>
                    <p className="text-xs text-gray-400 mt-1">November in Fort Lauderdale — 75-82°F. Pack summer clothes and sunscreen!</p>
                  </div>
                </div>
              </div>
            )}

            {/* Gallery */}
            {galleryImages && galleryImages.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                <div className="flex items-center gap-2 mb-6">
                  <ImageIcon className="w-5 h-5 text-neuro-orange" />
                  <h2 className="text-lg font-black text-neuro-navy">Photos</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {galleryImages.map((img, gi) => (
                    <img key={gi} src={img} alt="" className="w-full aspect-video object-cover rounded-xl" />
                  ))}
                </div>
              </div>
            )}

            {/* Host Bio */}
            {seminar.instructor_bio && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                <h2 className="text-lg font-black text-neuro-navy mb-4">About the Hosts</h2>
                <div className="flex items-start gap-4">
                  {seminar.host_doctor?.photo_url && (
                    <img src={seminar.host_doctor.photo_url} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                  )}
                  <p className="text-gray-600 leading-relaxed">{seminar.instructor_bio}</p>
                </div>
              </div>
            )}

            {/* FAQ */}
            {faq && faq.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                <div className="flex items-center gap-2 mb-6">
                  <HelpCircle className="w-5 h-5 text-neuro-orange" />
                  <h2 className="text-lg font-black text-neuro-navy">FAQ</h2>
                </div>
                <div className="space-y-2">
                  {faq.map((item, fi) => (
                    <div key={fi} className="border border-gray-100 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setOpenFaq(openFaq === fi ? null : fi)}
                        className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-bold text-neuro-navy text-sm">{item.question}</span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openFaq === fi ? 'rotate-180' : ''}`} />
                      </button>
                      {openFaq === fi && (
                        <div className="px-4 pb-4">
                          <p className="text-sm text-gray-600 leading-relaxed">{item.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {seminar.tags && seminar.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {seminar.tags.map((tag: string, i: number) => (
                  <span key={i} className="px-3 py-1.5 bg-neuro-orange/5 text-neuro-orange text-xs font-bold rounded-lg border border-neuro-orange/10">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Reviews */}
            <SeminarReviews seminarId={id} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24 space-y-5">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Event Details</h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-neuro-orange mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-neuro-navy text-sm">{seminar.dates}</p>
                    {seminar.start_time && seminar.end_time && (
                      <p className="text-xs text-gray-500">{seminar.start_time} – {seminar.end_time}</p>
                    )}
                  </div>
                </div>

                {(venueName || location) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-neuro-orange mt-0.5 shrink-0" />
                    <div>
                      {venueName && <p className="font-bold text-neuro-navy text-sm">{venueName}</p>}
                      <p className="text-xs text-gray-500">{venueAddress || location}</p>
                    </div>
                  </div>
                )}

                {speakers && speakers.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Mic2 className="w-5 h-5 text-neuro-orange mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-neuro-navy text-sm">{speakers.length} Speakers</p>
                      <p className="text-xs text-gray-500">Industry leaders & coaches</p>
                    </div>
                  </div>
                )}

                {s.ce_hours && (
                  <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-200">
                      {s.ce_hours} CE Hours
                    </span>
                  </div>
                )}

                {seminar.price != null && (
                  <div className="pt-3 border-t border-gray-100">
                    {seminar.price > 0 ? (
                      <p className="text-2xl font-black text-neuro-navy">${seminar.price} <span className="text-sm font-normal text-gray-400">per person</span></p>
                    ) : (
                      <p className="text-2xl font-black text-green-600">Free</p>
                    )}
                  </div>
                )}

                {seminar.max_capacity && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Users className="w-4 h-4" />
                    <span>{seminar.max_capacity} spots</span>
                  </div>
                )}
              </div>

              {seminar.registration_link && (
                <a
                  href={seminar.registration_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleRegisterClick}
                  className="w-full py-4 bg-neuro-orange text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-neuro-orange/90 transition-colors"
                >
                  Register Now <ExternalLink className="w-4 h-4" />
                </a>
              )}

              {/* Quick actions */}
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <button onClick={handleCopyLink} className="w-full py-2.5 text-xs font-bold text-gray-500 hover:text-neuro-navy bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-2">
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Link Copied!' : 'Copy Event Link'}
                </button>
                {calendarUrl && (
                  <a href={calendarUrl} target="_blank" rel="noopener noreferrer" className="w-full py-2.5 text-xs font-bold text-gray-500 hover:text-neuro-navy bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    Add to Calendar
                  </a>
                )}
                <button onClick={handleShare} className="w-full py-2.5 text-xs font-bold text-gray-500 hover:text-neuro-navy bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-2">
                  <Share2 className="w-3.5 h-3.5" />
                  Share Event
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mid-page CTA */}
      {seminar.registration_link && (
        <section className="bg-neuro-navy py-14 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-heading font-black text-white mb-4">Ready to Be Brave?</h2>
            <p className="text-gray-400 mb-8">
              {speakers?.length || 0} world-class speakers. {schedule?.filter(d => d.items.length > 2).length || 2} days of transformation. One oceanfront venue.
            </p>
            <a
              href={seminar.registration_link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleRegisterClick}
              className="px-10 py-5 bg-neuro-orange text-white font-bold rounded-xl text-lg inline-flex items-center gap-2 hover:bg-neuro-orange/90 transition-colors shadow-lg shadow-neuro-orange/20"
            >
              Register Now — ${seminar.price} <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </section>
      )}

      {/* Related Seminars */}
      {relatedSeminars.length > 0 && (
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-xl font-heading font-black text-neuro-navy mb-6">You Might Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedSeminars.map((rs: any) => (
              <Link key={rs.id} href={`/seminars/${rs.id}`} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg transition-shadow group">
                <p className="text-xs text-neuro-orange font-bold mb-1">{rs.dates}</p>
                <h3 className="font-bold text-neuro-navy text-sm mb-2 group-hover:text-neuro-orange transition-colors">{rs.title}</h3>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <MapPin className="w-3 h-3" />
                  <span>{rs.city}, {rs.country}</span>
                </div>
                {rs.price != null && (
                  <p className="text-sm font-black text-neuro-navy mt-3">{rs.price > 0 ? `$${rs.price}` : 'Free'}</p>
                )}
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/seminars" className="text-neuro-orange font-bold text-sm hover:underline inline-flex items-center gap-1">
              View All Seminars <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      <Footer />

      {/* Sticky Mobile CTA */}
      {seminar.registration_link && (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-3 flex items-center justify-between gap-3">
          <div>
            {seminar.price != null && (
              <p className="text-lg font-black text-neuro-navy">{seminar.price > 0 ? `$${seminar.price}` : 'Free'}</p>
            )}
            <p className="text-[10px] text-gray-400 font-bold uppercase">per person</p>
          </div>
          <a
            href={seminar.registration_link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleRegisterClick}
            className="flex-1 max-w-[200px] py-3.5 bg-neuro-orange text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-neuro-orange/90 transition-colors"
          >
            Register Now <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}
    </div>
  );
}
