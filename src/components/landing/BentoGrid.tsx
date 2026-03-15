"use client";

import { motion } from "framer-motion";
import { Search, GraduationCap, Users, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function BentoGrid() {
  return (
    <section className="py-24 px-6 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[400px]">
          
          {/* Card 1: Directory (Large) */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="md:col-span-2 relative group overflow-hidden rounded-3xl bg-neuro-navy text-white p-10 flex flex-col justify-between"
          >
            <div 
              className="absolute inset-0 bg-[url('/grid.svg')] opacity-20 bg-repeat transition-transform duration-700 group-hover:scale-110" 
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neuro-navy via-neuro-navy/50 to-transparent" aria-hidden="true" />
            
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-6 border border-white/20">
                <Search className="w-6 h-6 text-neuro-orange" aria-hidden="true" />
              </div>
              <h3 className="text-3xl font-heading font-bold mb-2 text-white">Global Directory</h3>
              <p className="text-gray-300 max-w-md text-lg">
                The world's most trusted network of nervous system focused chiropractors. Verified, elite, and accessible.
              </p>
            </div>

            <div className="relative z-10 flex items-center gap-4">
              <Link 
                href="/directory" 
                className="flex items-center gap-2 text-white font-bold group-hover:text-neuro-orange transition-colors min-h-[44px] px-2"
                aria-label="Search the Global Directory for a chiropractor"
              >
                Find a Doctor <ArrowUpRight className="w-5 h-5" aria-hidden="true" />
              </Link>
            </div>
          </motion.article>

          {/* Card 2: Seminars (Tall) */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="relative group overflow-hidden rounded-3xl bg-neuro-cream border border-gray-100 p-10 flex flex-col justify-between"
          >
             <div className="absolute -right-10 -top-10 w-40 h-40 bg-neuro-orange/10 rounded-full blur-3xl transition-opacity group-hover:opacity-100 opacity-50" aria-hidden="true" />
            
            <div>
              <div className="w-12 h-12 rounded-full bg-neuro-orange/10 flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-neuro-orange" aria-hidden="true" />
              </div>
              <h3 className="text-3xl font-heading font-bold mb-2 text-neuro-navy">Seminars</h3>
              <p className="text-gray-600 text-lg">
                Master the protocols and clinical implementation of neuro-chiropractic.
              </p>
            </div>

            <Link 
              href="/seminars" 
              className="flex items-center gap-2 text-neuro-navy font-bold group-hover:translate-x-1 transition-transform min-h-[44px] px-2"
              aria-label="Find upcoming clinical seminars"
            >
              Find a Seminar <ArrowUpRight className="w-5 h-5" aria-hidden="true" />
            </Link>
          </motion.article>

          {/* Card 3: Students (Wide) */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="md:col-span-3 relative group overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 text-white p-10 flex flex-col md:flex-row items-center justify-between gap-8"
          >
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" aria-hidden="true" />
            
            <div className="relative z-10 flex-1">
              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-6 border border-white/20">
                <GraduationCap className="w-6 h-6 text-blue-400" aria-hidden="true" />
              </div>
              <h3 className="text-3xl font-heading font-bold mb-4 text-white">Student Career Platform</h3>
              <p className="text-gray-300 text-lg max-w-2xl">
                Launch your career with mentorship, job placement, and a community that supports your growth from day one.
              </p>
            </div>

            <div className="relative z-10">
               <Link 
                 href="/register?role=student" 
                 className="px-8 py-4 bg-white text-neuro-navy rounded-full font-bold hover:bg-gray-100 transition-colors inline-block min-h-[44px] flex items-center"
                 aria-label="Register as a student"
               >
                 Join as Student
               </Link>
            </div>
          </motion.article>

        </div>
      </div>
    </section>
  );
}
