"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import {
  ArrowLeft, Loader2, ExternalLink, Globe, Instagram, Linkedin,
  Youtube, MapPin, Award, BookOpen, Mic2, Mail, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { getSeminarById } from "../../../actions";
import Footer from "@/components/landing/Footer";

interface Speaker {
  name: string;
  title: string;
  photo_url?: string;
  bio?: string;
  full_bio?: string;
  website?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  email?: string;
  location?: string;
  credentials?: string;
  programs?: { name: string; description: string; url?: string }[];
  books?: { title: string; description?: string; url?: string }[];
  highlights?: string[];
  podcast?: string;
}

function speakerSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function SpeakerPage({ params }: { params: Promise<{ id: string; slug: string }> }) {
  const { id, slug } = React.use(params);
  const [speaker, setSpeaker] = useState<Speaker | null>(null);
  const [seminar, setSeminar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [allSpeakers, setAllSpeakers] = useState<Speaker[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await getSeminarById(id);
        setSeminar(data);
        const speakers = ((data as any)?.speakers || []) as Speaker[];
        setAllSpeakers(speakers);
        const found = speakers.find(s => speakerSlug(s.name) === slug);
        setSpeaker(found || null);
      } catch (e) {
        console.error("Failed to load speaker:", e);
      }
      setLoading(false);
    }
    load();
  }, [id, slug]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-neuro-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neuro-orange" />
      </div>
    );
  }

  if (!speaker || !seminar) {
    return (
      <div className="min-h-dvh bg-neuro-cream flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-black text-neuro-navy mb-4">Speaker Not Found</h1>
        <p className="text-gray-500 mb-6">This speaker doesn&apos;t exist or the event has been updated.</p>
        <Link href={`/seminars/${id}`} className="px-6 py-3 bg-neuro-orange text-white font-bold rounded-xl">Back to Event</Link>
      </div>
    );
  }

  const bio = speaker.full_bio || speaker.bio || '';
  const otherSpeakers = allSpeakers.filter(s => speakerSlug(s.name) !== slug).slice(0, 6);

  return (
    <div className="min-h-dvh bg-neuro-cream">
      {/* Hero */}
      <section className="bg-neuro-navy text-white pt-28 pb-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-20 w-60 h-60 bg-neuro-orange rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-40 h-40 bg-blue-500 rounded-full blur-3xl" />
        </div>
        <div className="max-w-3xl mx-auto relative z-10">
          <Link href={`/seminars/${id}`} className="text-xs text-gray-400 hover:text-white transition-colors mb-8 inline-flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Back to {seminar.title}
          </Link>

          <div className="flex flex-col sm:flex-row items-start gap-6 mt-4">
            {/* Photo */}
            {speaker.photo_url ? (
              <img
                src={speaker.photo_url}
                alt={speaker.name}
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover border-2 border-white/10 shadow-2xl shrink-0"
              />
            ) : (
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-white/10 flex items-center justify-center text-white font-bold text-3xl shrink-0">
                {speaker.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
            )}

            <div>
              <h1 className="text-3xl md:text-4xl font-heading font-black text-white mb-2">
                {speaker.name}
              </h1>
              <p className="text-neuro-orange font-bold text-lg mb-3">{speaker.title}</p>

              {speaker.location && (
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                  <MapPin className="w-4 h-4 text-neuro-orange" />
                  {speaker.location}
                </div>
              )}

              {speaker.credentials && (
                <p className="text-gray-400 text-sm mb-4">{speaker.credentials}</p>
              )}

              {/* Social Links */}
              <div className="flex items-center gap-2 flex-wrap">
                {speaker.website && (
                  <a href={speaker.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-white transition-colors">
                    <Globe className="w-3.5 h-3.5" /> Website
                  </a>
                )}
                {speaker.instagram && (
                  <a href={speaker.instagram} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-white transition-colors">
                    <Instagram className="w-3.5 h-3.5" /> Instagram
                  </a>
                )}
                {speaker.linkedin && (
                  <a href={speaker.linkedin} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-white transition-colors">
                    <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                  </a>
                )}
                {speaker.youtube && (
                  <a href={speaker.youtube} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-white transition-colors">
                    <Youtube className="w-3.5 h-3.5" /> YouTube
                  </a>
                )}
                {speaker.podcast && (
                  <a href={speaker.podcast} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-white transition-colors">
                    <Mic2 className="w-3.5 h-3.5" /> Podcast
                  </a>
                )}
                {speaker.email && (
                  <a href={`mailto:${speaker.email}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-white transition-colors">
                    <Mail className="w-3.5 h-3.5" /> Email
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        {/* Bio */}
        {bio && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
            <h2 className="text-lg font-black text-neuro-navy mb-4">About</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{bio}</p>
          </div>
        )}

        {/* Highlights */}
        {speaker.highlights && speaker.highlights.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
            <div className="flex items-center gap-2 mb-5">
              <Award className="w-5 h-5 text-neuro-orange" />
              <h2 className="text-lg font-black text-neuro-navy">Highlights</h2>
            </div>
            <div className="space-y-3">
              {speaker.highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-neuro-orange/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-neuro-orange">{i + 1}</span>
                  </div>
                  <p className="text-sm text-gray-600">{h}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Programs / Products */}
        {speaker.programs && speaker.programs.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
            <div className="flex items-center gap-2 mb-5">
              <Award className="w-5 h-5 text-neuro-orange" />
              <h2 className="text-lg font-black text-neuro-navy">Programs & Products</h2>
            </div>
            <div className="space-y-4">
              {speaker.programs.map((p, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-neuro-navy">{p.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{p.description}</p>
                    </div>
                    {p.url && (
                      <a href={p.url} target="_blank" rel="noopener noreferrer"
                        className="px-4 py-2 bg-neuro-orange text-white font-bold rounded-lg text-xs hover:bg-neuro-orange/90 transition-colors shrink-0 flex items-center gap-1">
                        Learn More <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Books */}
        {speaker.books && speaker.books.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
            <div className="flex items-center gap-2 mb-5">
              <BookOpen className="w-5 h-5 text-neuro-orange" />
              <h2 className="text-lg font-black text-neuro-navy">Books</h2>
            </div>
            <div className="space-y-4">
              {speaker.books.map((b, i) => (
                <div key={i} className="flex items-start gap-4 bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <BookOpen className="w-8 h-8 text-neuro-orange shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-bold text-neuro-navy italic">{b.title}</h3>
                    {b.description && <p className="text-sm text-gray-500 mt-1">{b.description}</p>}
                  </div>
                  {b.url && (
                    <a href={b.url} target="_blank" rel="noopener noreferrer"
                      className="px-4 py-2 bg-neuro-navy text-white font-bold rounded-lg text-xs hover:bg-neuro-navy/90 transition-colors shrink-0 flex items-center gap-1">
                      Get Book <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        {seminar.registration_link && (
          <div className="bg-neuro-navy rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-heading font-black text-white mb-3">
              See {speaker.name.split(' ')[0]} Live
            </h2>
            <p className="text-gray-400 mb-6">
              {speaker.name.split(' ')[0]} is speaking at {seminar.title} — {seminar.dates} at {(seminar as any).venue_name || seminar.location}.
            </p>
            <a
              href={seminar.registration_link}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-neuro-orange text-white font-bold rounded-xl text-lg inline-flex items-center gap-2 hover:bg-neuro-orange/90 transition-colors shadow-lg shadow-neuro-orange/20"
            >
              Register Now — ${seminar.price} <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        )}

        {/* Other Speakers */}
        {otherSpeakers.length > 0 && (
          <div>
            <h2 className="text-lg font-black text-neuro-navy mb-4">Other Speakers</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {otherSpeakers.map((s, i) => (
                <Link
                  key={i}
                  href={`/seminars/${id}/speakers/${speakerSlug(s.name)}`}
                  className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-lg transition-shadow group text-center"
                >
                  {s.photo_url ? (
                    <img src={s.photo_url} alt={s.name} className="w-16 h-16 rounded-xl object-cover mx-auto mb-3" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-neuro-navy/10 flex items-center justify-center text-neuro-navy font-bold text-sm mx-auto mb-3">
                      {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                  )}
                  <p className="font-bold text-neuro-navy text-xs group-hover:text-neuro-orange transition-colors">{s.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{s.title}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
