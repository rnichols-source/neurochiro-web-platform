"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { createSeminarListingCheckout, createMemberSeminar } from "./actions";
import { useRegion } from "@/context/RegionContext";

export default function HostSeminarPage() {
  const { region } = useRegion();
  const [isMember, setIsMember] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserEmail(user.email || "");
      const { data } = await supabase
        .from("profiles")
        .select("subscription_status")
        .eq("id", user.id)
        .single();
      if (data?.subscription_status === "active") setIsMember(true);
    });
  }, []);

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

    if (isMember) {
      const result = await createMemberSeminar(seminarData);
      if (result.error) { setError(result.error); setLoading(false); return; }
      setSuccess(true);
      setLoading(false);
      return;
    }

    const result = await createSeminarListingCheckout(seminarData);
    if (result.error) { setError(result.error); setLoading(false); return; }
    if (result.url) window.location.href = result.url;
  };

  if (success) {
    return (
      <div className="min-h-dvh bg-neuro-cream pt-32 pb-20 text-center px-6">
        <h1 className="text-3xl font-heading font-black text-neuro-navy mb-4">Seminar Listed!</h1>
        <p className="text-gray-500 mb-8">Your seminar is now live in the directory.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/seminars" className="px-8 py-3 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors">View All Seminars</Link>
          <Link href="/doctor/seminars" className="px-8 py-3 bg-neuro-navy text-white font-bold rounded-xl hover:bg-neuro-navy/90 transition-colors">Manage My Seminars</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-neuro-cream pt-24 pb-20">
      <div className="max-w-xl mx-auto px-6">
        <div className="text-center mb-10 space-y-3">
          <span className="text-neuro-orange font-black uppercase tracking-[0.4em] text-[10px]">Educator Network</span>
          <h1 className="text-4xl font-heading font-black text-neuro-navy">Host a Seminar</h1>
          <p className="text-gray-500">Share your expertise with the NeuroChiro community.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-xl space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Title</label>
            <input name="title" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-neuro-orange" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Description</label>
            <textarea name="description" rows={3} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-neuro-orange resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Location</label>
              <input name="location" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-neuro-orange" />
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
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Price</label>
              <input name="price" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-neuro-orange" placeholder="$299" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Capacity</label>
              <input name="capacity" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-neuro-orange" placeholder="50" />
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
            {loading ? "Processing..." : isMember ? "List Your Seminar — Free with Membership" : `List Your Seminar — ${region.currency.symbol}199`}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          NeuroChiro members host seminars for free. Not a member?{" "}
          <Link href="/register?role=doctor" className="text-neuro-orange font-bold hover:underline">Join free</Link>.
        </p>
      </div>
    </div>
  );
}
