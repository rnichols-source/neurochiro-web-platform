"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { createSeminarListingCheckout, createMemberSeminar } from "./actions";
import { CheckCircle2, Calendar, Users, Award, Mail, TrendingUp, Star, Zap } from "lucide-react";

type ListingType = "single" | "annual";

export default function HostSeminarPage() {
  const [isMember, setIsMember] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userCity, setUserCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [listingType, setListingType] = useState<ListingType>("single");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserEmail(user.email || "");
      const { data: profile } = await supabase.from("profiles").select("full_name, tier").eq("id", user.id).single();
      const paidTiers = ["pro", "growth", "basic"];
      if (profile?.tier && paidTiers.includes(profile.tier)) setIsMember(true);
      const { data: doc } = await (supabase as any).from("doctors").select("city, state, is_founding_member, membership_tier").eq("user_id", user.id).maybeSingle();
      if (doc?.city) setUserCity(`${doc.city}${doc.state ? ', ' + doc.state : ''}`);
      if ((doc as any)?.is_founding_member || ['pro', 'growth'].includes((doc as any)?.membership_tier || '')) setIsMember(true);
    });
  }, []);

  const singlePrice = isMember ? 99 : 299;
  const annualPrice = isMember ? 499 : 999;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const seminarData = {
      title: fd.get("title") as string,
      description: fd.get("description") as string,
      location: fd.get("location") as string,
      dates: fd.get("dates") as string,
      registrationLink: fd.get("registrationLink") as string,
      price: fd.get("price") as string,
      capacity: fd.get("capacity") as string,
      hostEmail: userEmail || (fd.get("hostEmail") as string),
    };

    const result = await createSeminarListingCheckout(seminarData);
    if (result.error) { setError(result.error); setLoading(false); return; }
    if (result.url) window.location.href = result.url;
  };

  if (success) {
    return (
      <div className="min-h-dvh bg-neuro-cream pt-32 pb-20 text-center px-6">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-heading font-black text-neuro-navy mb-4">Seminar Listed!</h1>
        <p className="text-gray-500 mb-8">Your event is now live and being promoted to the NeuroChiro community.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/seminars" className="px-8 py-3 bg-neuro-orange text-white font-bold rounded-xl">View All Seminars</Link>
          <Link href="/doctor/seminars" className="px-8 py-3 bg-neuro-navy text-white font-bold rounded-xl">Manage My Seminars</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-neuro-cream pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        {/* Hero */}
        <div className="text-center mb-12 space-y-3">
          <span className="text-neuro-orange font-black uppercase tracking-[0.4em] text-[10px]">Educator Network</span>
          <h1 className="text-3xl md:text-4xl font-heading font-black text-neuro-navy">Get Your Seminar in Front of 140+ Nervous System Chiropractors</h1>
          <p className="text-gray-500 max-w-xl mx-auto">NeuroChiro promotes your event to the exact audience you want — verified, specialty-specific doctors actively looking for seminars.</p>
        </div>

        {/* What's Included */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-8">
          <h2 className="text-lg font-heading font-black text-neuro-navy mb-6 text-center">Every Listing Includes</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Calendar, label: "Full Event Page", desc: "Schedule, speakers, venue, FAQ" },
              { icon: Mail, label: "Email Blast", desc: "Sent to matched doctors" },
              { icon: Award, label: "CE Tracking", desc: "QR check-in + certificates" },
              { icon: Star, label: "Reviews", desc: "Verified attendee reviews" },
              { icon: TrendingUp, label: "Analytics", desc: "Views, clicks, registrations" },
              { icon: Users, label: "Attendee Management", desc: "Full attendee list + export" },
              { icon: Zap, label: "Featured Placement", desc: "Homepage for 2 weeks" },
              { icon: CheckCircle2, label: "Promotion", desc: "Push notifications to doctors" },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <item.icon className="w-6 h-6 text-neuro-orange mx-auto mb-2" />
                <p className="text-sm font-bold text-neuro-navy">{item.label}</p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => { setListingType("single"); setShowForm(true); }}
            className={`bg-white rounded-2xl border-2 p-8 text-left transition-all ${
              listingType === "single" && showForm ? "border-neuro-orange shadow-xl shadow-neuro-orange/10" : "border-gray-100 hover:border-gray-200"
            }`}
          >
            <h3 className="text-xl font-heading font-black text-neuro-navy mb-1">Single Event</h3>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-4xl font-black text-neuro-navy">${singlePrice}</span>
              <span className="text-gray-400 font-bold">/event</span>
            </div>
            {isMember && <p className="text-xs text-green-600 font-bold mb-3">Member price — save $200</p>}
            <ul className="space-y-2">
              {["Full event page with all features", "Email blast to matched doctors", "CE tracking + certificates", "Featured for 2 weeks"].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> {f}
                </li>
              ))}
            </ul>
          </button>

          <button
            onClick={() => { setListingType("annual"); setShowForm(true); }}
            className={`bg-white rounded-2xl border-2 p-8 text-left transition-all relative ${
              listingType === "annual" && showForm ? "border-neuro-orange shadow-xl shadow-neuro-orange/10" : "border-gray-100 hover:border-gray-200"
            }`}
          >
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-neuro-orange text-white text-[10px] font-black uppercase tracking-widest rounded-full">Best Value</span>
            <h3 className="text-xl font-heading font-black text-neuro-navy mb-1">Annual Host Pass</h3>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-4xl font-black text-neuro-navy">${annualPrice}</span>
              <span className="text-gray-400 font-bold">/year</span>
            </div>
            {isMember && <p className="text-xs text-green-600 font-bold mb-3">Member price — save $500</p>}
            <ul className="space-y-2">
              {["Unlimited listings for 12 months", "Everything in Single Event", "Pays for itself after 4 events", "Priority placement on all listings"].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> {f}
                </li>
              ))}
            </ul>
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-xl space-y-5">
            <h2 className="text-lg font-heading font-black text-neuro-navy">
              {listingType === "annual" ? "Get Your Annual Host Pass" : "List Your Seminar"}
            </h2>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Seminar Title</label>
              <input name="title" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-neuro-orange" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Description</label>
              <textarea name="description" rows={3} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-neuro-orange resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Location</label>
                <input name="location" required defaultValue={userCity} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-neuro-orange" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Dates</label>
                <input name="dates" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-neuro-orange" placeholder="e.g. June 15-17, 2026" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Registration Link</label>
              <input name="registrationLink" type="url" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-neuro-orange" placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Ticket Price</label>
                <input name="price" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-neuro-orange" placeholder="$299" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Capacity</label>
                <input name="capacity" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-neuro-orange" placeholder="50" />
              </div>
            </div>
            {!userEmail && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Your Email</label>
                <input name="hostEmail" type="email" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-neuro-orange" />
              </div>
            )}
            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
            <button type="submit" disabled={loading} className="w-full py-4 bg-neuro-orange text-white font-black uppercase tracking-widest rounded-xl hover:bg-neuro-orange-dark transition-all disabled:opacity-50">
              {loading ? "Processing..." : listingType === "annual" ? `Get Annual Pass — $${annualPrice}` : `List Seminar — $${singlePrice}`}
            </button>
          </form>
        )}

        {/* Member CTA */}
        {!isMember && (
          <div className="mt-8 bg-neuro-navy rounded-2xl p-6 text-center">
            <p className="text-white font-bold mb-2">NeuroChiro members save up to $500</p>
            <p className="text-gray-400 text-sm mb-4">Members pay $99/event or $499/year instead of $299/$999.</p>
            <Link href="/pricing" className="px-6 py-3 bg-neuro-orange text-white font-bold rounded-xl text-sm inline-block hover:bg-neuro-orange/90">
              View Membership Plans
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
