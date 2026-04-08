"use client";

import NextImage from "next/image";
import { ShieldCheck, Star, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface DoctorCardProps {
  doc: any;
  index: number;
}

export default function DoctorCard({ doc, index }: DoctorCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      key={`${doc.id}-${index}`} 
      className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden"
    >
      <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-2xl bg-neuro-navy overflow-hidden shadow-lg border border-white/10 flex items-center justify-center">
                {doc.photo_url ? (
                  <NextImage 
                    src={doc.photo_url} 
                    alt={`Dr. ${doc.first_name} ${doc.last_name}`} 
                    fill 
                    className="object-cover" 
                    sizes="56px" 
                    loading="lazy"
                  />
                ) : (
                  <span className="text-white font-black text-xl">{(doc.first_name?.[0] || 'N').toUpperCase()}</span>
                )}
            </div>
            <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h3 className="font-bold text-lg text-neuro-navy group-hover:text-neuro-orange transition-colors">{`Dr. ${doc.first_name || ''} ${doc.last_name || ''}`.replace(/^Dr\.\s+Dr\./i, 'Dr.').trim()}</h3>
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-xs text-gray-500 font-medium">{doc.clinic_name || 'Private Practice'}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-1 text-neuro-orange">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="text-sm font-black text-neuro-navy">{doc.rating || "5.0"}</span>
            </div>
          </div>
      </div>
      <Link href={`/directory/${doc.slug || doc.id}`}>
        <motion.div 
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full py-4 bg-gray-50 group-hover:bg-neuro-navy group-hover:text-white text-neuro-navy font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 border border-gray-100 group-hover:border-neuro-navy"
        >
          View Profile <ArrowRight className="w-4 h-4" />
        </motion.div>
      </Link>
    </motion.div>
  );
}
