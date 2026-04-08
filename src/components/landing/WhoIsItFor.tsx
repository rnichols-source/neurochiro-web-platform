"use client";

import Link from "next/link";
import { Stethoscope, GraduationCap, Heart, ArrowRight } from "lucide-react";
import { useRegion } from "@/context/RegionContext";

export default function WhoIsItFor() {
  const { region } = useRegion();

  return (
    <section className="max-w-5xl mx-auto px-6 py-16">
      <h2 className="text-2xl font-heading font-black text-neuro-navy text-center mb-10">Who Is NeuroChiro For?</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/pricing/doctors" className="bg-white rounded-2xl border border-gray-100 p-6 text-center hover:shadow-lg hover:border-gray-200 transition-all">
          <Stethoscope className="w-8 h-8 text-neuro-orange mx-auto mb-3" />
          <h3 className="font-bold text-neuro-navy mb-1">For Doctors</h3>
          <p className="text-gray-500 text-sm mb-3">Get your practice listed in the global directory.</p>
          <p className="text-neuro-orange font-bold text-sm">{region.currency.symbol}{region.pricing.doctor.starter.monthly}/mo <ArrowRight className="w-3 h-3 inline" /></p>
        </Link>
        <Link href="/pricing/students" className="bg-white rounded-2xl border border-gray-100 p-6 text-center hover:shadow-lg hover:border-gray-200 transition-all">
          <GraduationCap className="w-8 h-8 text-neuro-orange mx-auto mb-3" />
          <h3 className="font-bold text-neuro-navy mb-1">For Students</h3>
          <p className="text-gray-500 text-sm mb-3">Find jobs, attend seminars, and launch your career.</p>
          <p className="text-neuro-orange font-bold text-sm">{region.currency.symbol}{region.pricing.student.foundation.monthly}/mo <ArrowRight className="w-3 h-3 inline" /></p>
        </Link>
        <Link href="/register?role=patient" className="bg-white rounded-2xl border border-gray-100 p-6 text-center hover:shadow-lg hover:border-gray-200 transition-all">
          <Heart className="w-8 h-8 text-neuro-orange mx-auto mb-3" />
          <h3 className="font-bold text-neuro-navy mb-1">For Patients</h3>
          <p className="text-gray-500 text-sm mb-3">Track your health and find the right specialist.</p>
          <p className="text-neuro-orange font-bold text-sm">Free <ArrowRight className="w-3 h-3 inline" /></p>
        </Link>
      </div>
    </section>
  );
}
