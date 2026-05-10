"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Calendar, MapPin, ArrowLeft, Loader2, ExternalLink, Users, Clock, Award, HelpCircle, Image as ImageIcon, ChevronDown } from "lucide-react";
import Link from "next/link";
import { getSeminarById, incrementSeminarStats } from "../actions";
import Footer from "@/components/landing/Footer";
import SeminarReviews from "./seminar-reviews";

export default function SeminarDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [seminar, setSeminar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const data = await getSeminarById(id);
      setSeminar(data);
      setLoading(false);
      if (id) incrementSeminarStats(id, "page_views").catch(() => {});
    }
    load();
  }, [id]);

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

  return (
    <div className="min-h-dvh bg-neuro-cream">
      {/* Hero */}
      <section className={`text-white pt-28 pb-14 px-6 relative overflow-hidden ${heroImage ? '' : 'bg-neuro-navy'}`}>
        {heroImage && (
          <>
            <div className="absolute inset-0">
              <img src={heroImage} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-neuro-navy/80" />
            </div>
          </>
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

          {/* Register CTA in hero */}
          {seminar.registration_link && (
            <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <a
                href={seminar.registration_link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => incrementSeminarStats(id, "clicks").catch(() => {})}
                className="px-8 py-4 bg-neuro-orange text-white font-bold rounded-xl text-lg flex items-center gap-2 hover:bg-neuro-orange/90 transition-colors shadow-lg shadow-neuro-orange/20"
              >
                Register Now <ExternalLink className="w-5 h-5" />
              </a>
              {seminar.price != null && (
                <span className="text-2xl font-black text-white">
                  {seminar.price > 0 ? `$${seminar.price}` : 'Free'}
                  {seminar.price > 0 && <span className="text-sm font-normal text-gray-400 ml-1">per person</span>}
                </span>
              )}
            </div>
          )}
        </div>
      </section>

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
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-400 w-20 shrink-0">{item.time}</span>
                              <span className="text-sm font-bold text-neuro-navy">{item.title}</span>
                            </div>
                            {item.description && <p className="text-xs text-gray-500 ml-[88px] mt-0.5">{item.description}</p>}
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
                  <Users className="w-5 h-5 text-neuro-orange" />
                  <h2 className="text-lg font-black text-neuro-navy">Speakers</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {speakers.map((speaker, si) => (
                    <div key={si} className="flex items-start gap-4 bg-gray-50 rounded-xl p-4">
                      {speaker.photo_url ? (
                        <img src={speaker.photo_url} alt={speaker.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-neuro-navy/5 flex items-center justify-center text-neuro-navy font-bold text-lg shrink-0">
                          {speaker.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-neuro-navy">{speaker.name}</p>
                        <p className="text-xs text-neuro-orange font-bold">{speaker.title}</p>
                        {speaker.bio && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{speaker.bio}</p>}
                      </div>
                    </div>
                  ))}
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
                <h2 className="text-lg font-black text-neuro-navy mb-4">About the Host</h2>
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
                  onClick={() => incrementSeminarStats(id, "clicks").catch(() => {})}
                  className="w-full py-4 bg-neuro-orange text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-neuro-orange/90 transition-colors"
                >
                  Register Now <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
