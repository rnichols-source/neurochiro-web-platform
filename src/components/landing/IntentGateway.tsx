"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, ArrowRight, User, GraduationCap, Stethoscope } from "lucide-react";
import Link from "next/link";

type UserType = "patient" | "student" | "doctor" | null;

export default function IntentGateway() {
  const [activeTab, setActiveTab] = useState<UserType>("doctor");
  const [locationQuery, setLocationQuery] = useState("");

  return (
    <div className="w-full max-w-5xl mx-auto -mt-20 relative z-20 px-6">
      <div className="bg-white rounded-3xl shadow-2xl shadow-neuro-navy/20 overflow-hidden border border-white/20 backdrop-blur-xl">
        
        {/* Role Selector Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab("doctor")}
            className={`flex-1 py-7 text-center font-heading font-black text-lg transition-all flex items-center justify-center gap-3 border-b-2 ${
              activeTab === "doctor" ? "bg-white text-neuro-navy border-neuro-navy" : "bg-gray-50 text-gray-400 hover:bg-gray-100 border-transparent"
            }`}
          >
            <Stethoscope className={activeTab === "doctor" ? "w-6 h-6" : "w-5 h-5"} />
            I'm a Doctor
          </button>
          <button
            onClick={() => setActiveTab("student")}
            className={`flex-1 py-7 text-center font-heading font-black text-lg transition-all flex items-center justify-center gap-3 border-b-2 ${
              activeTab === "student" ? "bg-white text-blue-600 border-blue-600" : "bg-gray-50 text-gray-400 hover:bg-gray-100 border-transparent"
            }`}
          >
            <GraduationCap className={activeTab === "student" ? "w-6 h-6" : "w-5 h-5"} />
            I'm a Student
          </button>
          <button
            onClick={() => setActiveTab("patient")}
            className={`flex-1 py-7 text-center font-heading font-black text-lg transition-all flex items-center justify-center gap-3 border-b-2 ${
              activeTab === "patient" ? "bg-white text-neuro-orange border-neuro-orange" : "bg-gray-50 text-gray-400 hover:bg-gray-100 border-transparent"
            }`}
          >
            <User className={activeTab === "patient" ? "w-6 h-6" : "w-5 h-5"} />
            I'm a Patient
          </button>
        </div>

        {/* Interactive Content Area */}
        <div className="p-8 md:p-10 min-h-[200px]">
          <AnimatePresence mode="wait">
            
            {/* PATIENT VIEW */}
            {activeTab === "patient" && (
              <motion.div
                key="patient"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col md:flex-row gap-8 items-center"
              >
                <div className="flex-1 space-y-4">
                  <h3 className="text-2xl font-heading font-bold text-neuro-navy">Find relief tailored to your nervous system.</h3>
                  <div className="flex gap-3 flex-wrap">
                    {["Migraines", "Anxiety", "Sleep", "Regulation", "Wellness"].map((tag) => (
                      <Link 
                        key={tag} 
                        href={`/directory?search=${tag.toLowerCase()}`}
                        className="px-4 py-2 bg-neuro-cream rounded-full text-neuro-navy font-medium text-sm cursor-pointer hover:bg-neuro-orange/10 hover:text-neuro-orange transition-colors"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="w-full md:w-auto flex flex-col gap-4 min-w-[300px]">
                   <div className="relative">
                     <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                     <input 
                        type="text" 
                        placeholder="City, Zip, or Doctor Name" 
                        value={locationQuery}
                        onChange={(e) => setLocationQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/50 transition-all text-neuro-navy placeholder-gray-400 font-medium"
                     />
                   </div>
                   <Link 
                    href={`/directory${locationQuery ? `?location=${locationQuery}` : ''}`} 
                    className="w-full py-4 bg-neuro-orange text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors shadow-lg shadow-neuro-orange/20"
                   >
                     Find a Chiropractor <ArrowRight className="w-5 h-5" />
                   </Link>
                </div>
              </motion.div>
            )}

            {/* STUDENT VIEW */}
            {activeTab === "student" && (
              <motion.div
                key="student"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col md:flex-row gap-8 items-center"
              >
                <div className="flex-1 space-y-4">
                  <h3 className="text-2xl font-heading font-bold text-neuro-navy">Launch your career with certainty.</h3>
                  <p className="text-gray-500">Access mentorship, seminars, and job placements at elite nervous system focused clinics.</p>
                </div>
                <div className="w-full md:w-auto flex flex-col gap-4 min-w-[300px]">
                   <Link href="/register?role=student" className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                     Join Student Platform <ArrowRight className="w-5 h-5" />
                   </Link>
                   <div className="flex justify-between text-sm font-medium text-gray-500 px-2">
                      <span>Job Board</span>
                      <span>Mentorship</span>
                      <span>Seminars</span>
                   </div>
                </div>
              </motion.div>
            )}

            {/* DOCTOR VIEW */}
            {activeTab === "doctor" && (
              <motion.div
                key="doctor"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col md:flex-row gap-8 items-center"
              >
                <div className="flex-1 space-y-4">
                  <h3 className="text-2xl font-heading font-bold text-neuro-navy">Grow your authority and practice.</h3>
                  <p className="text-gray-500">Claim your verified profile, attract ideal patients, and recruit top associate talent.</p>
                </div>
                <div className="w-full md:w-auto flex flex-col gap-4 min-w-[300px]">
                   <div className="flex gap-4">
                      <Link href="/login" className="flex-1 py-4 bg-neuro-cream text-neuro-navy font-bold rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors">
                        Login
                      </Link>
                      <Link href="/register?role=doctor" className="flex-1 py-4 bg-neuro-navy text-white font-bold rounded-xl flex items-center justify-center hover:bg-neuro-navy-light transition-all shadow-lg shadow-neuro-navy/20">
                        Join
                      </Link>
                   </div>
                   <p className="text-center text-xs text-gray-400">Verified Doctors only.</p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
