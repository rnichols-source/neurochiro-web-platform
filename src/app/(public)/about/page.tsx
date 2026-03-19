"use client";

import { motion } from "framer-motion";
import { Users, Heart, Target, Sparkles } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-neuro-cream pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <span className="text-neuro-orange font-black uppercase tracking-[0.4em] text-[10px] block mb-4">Our Mission</span>
          <h1 className="text-5xl md:text-7xl font-heading font-black text-neuro-navy mb-8">
            Transforming Human <span className="text-neuro-orange">Potential.</span>
          </h1>
          <p className="text-gray-600 text-lg md:text-xl leading-relaxed">
            NeuroChiro is more than a platform. It's a movement dedicated to advancing the clinical science and professional impact of nervous-system-focused chiropractic.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-32">
          {[
            { icon: Users, title: "Community First", desc: "A global network of elite doctors and students." },
            { icon: Heart, title: "Patient Driven", desc: "Empowering patients with data and education." },
            { icon: Target, title: "Clinical Focus", desc: "Rooted in neurology and scientific progress." },
            { icon: Sparkles, title: "Modern Design", desc: "Built for the next generation of healthcare." }
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm"
            >
              <div className="w-12 h-12 bg-neuro-orange/10 rounded-2xl flex items-center justify-center text-neuro-orange mb-6">
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-neuro-navy mb-3">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
