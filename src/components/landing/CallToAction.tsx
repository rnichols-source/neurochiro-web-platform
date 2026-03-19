"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CallToAction() {
  return (
    <section className="py-32 px-6 bg-neuro-navy relative overflow-hidden flex items-center justify-center">
      {/* Dynamic Background */}
      <div className="absolute inset-0">
         <div className="absolute inset-0 bg-gradient-to-br from-neuro-navy to-gray-900" />
         <motion.div 
           animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.2, 0.1] }}
           transition={{ duration: 10, repeat: Infinity }}
           className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-neuro-orange/10 rounded-full blur-[120px]"
         />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-5xl md:text-7xl font-heading font-bold text-white mb-8 tracking-tight"
        >
          Join the <span className="text-transparent bg-clip-text bg-gradient-to-r from-neuro-orange to-orange-400">Evolution.</span>
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto"
        >
          Whether you're a student, a doctor, or a patient — the future of chiropractic starts here.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row gap-6 justify-center"
        >
           <Link href="/register" className="group relative px-10 py-5 bg-neuro-orange text-white rounded-full font-bold text-xl overflow-hidden shadow-2xl shadow-neuro-orange/30 hover:shadow-neuro-orange/50 transition-all hover:-translate-y-1">
            <span className="relative z-10 flex items-center gap-2">
              Get Started Now <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
