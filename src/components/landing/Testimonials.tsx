"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Quote, MapPin, Stethoscope, Heart, GraduationCap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const testimonials = [
  {
    quote: "I moved to a new state and needed to find a chiropractor who focuses on the nervous system, not just adjustments. This directory was exactly what I was looking for.",
    name: "Patient",
    role: "patient" as const,
    location: "United States",
    context: "Directory user",
  },
  {
    quote: "Patients who find me through NeuroChiro already understand what nervous system chiropractic is. I don't have to explain myself — they're looking for exactly what I do.",
    name: "Network Doctor",
    role: "doctor" as const,
    location: "United States",
    context: "Early member",
  },
  {
    quote: "We have snowbirds heading to Traverse City, MI and the nearest doc on the directory is over 3 hours away. The community is actively looking — we need more doctors in this area!",
    name: "Community Member",
    role: "patient" as const,
    location: "Traverse City, MI",
    context: "From our community",
  },
];

const roleIcon = {
  doctor: Stethoscope,
  patient: Heart,
  student: GraduationCap,
};

const roleColor = {
  doctor: "text-neuro-orange",
  patient: "text-red-400",
  student: "text-blue-400",
};

export default function Testimonials() {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((c) => (c + 1) % testimonials.length);
  const prev = () => setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length);

  const t = testimonials[current];
  const Icon = roleIcon[t.role];

  return (
    <section className="bg-neuro-navy py-20 px-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-40 h-40 bg-neuro-orange rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-60 h-60 bg-blue-500 rounded-full blur-3xl" />
      </div>

      <div className="max-w-3xl mx-auto relative z-10">
        <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-neuro-orange mb-3">
          Real People. Real Results.
        </p>
        <h2 className="text-2xl md:text-3xl font-heading font-black text-white text-center mb-12">
          What Our Community Says
        </h2>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 md:p-12"
            >
              <Quote className="w-8 h-8 text-neuro-orange/40 mb-6" />
              <p className="text-lg md:text-xl text-white/90 leading-relaxed mb-8 font-medium">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                    <Icon className={`w-5 h-5 ${roleColor[t.role]}`} />
                  </div>
                  <div>
                    <p className="font-bold text-white">{t.name}</p>
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <MapPin className="w-3 h-3" />
                      <span>{t.location}</span>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider hidden sm:block">
                  {t.context}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prev}
              className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === current ? "bg-neuro-orange w-6" : "bg-white/20"
                  }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
