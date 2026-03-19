"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface FeatureSectionProps {
  title: string;
  subtitle: string;
  description: string;
  imageSrc?: string;
  features: string[];
  reversed?: boolean;
}

export default function FeatureSection({ title, subtitle, description, features, reversed = false }: FeatureSectionProps) {
  return (
    <section className="py-24 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
        
        {/* Content Side */}
        <motion.div 
          initial={{ opacity: 0, x: reversed ? 50 : -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className={`flex-1 ${reversed ? "md:order-2" : "md:order-1"}`}
        >
          <span className="text-neuro-orange font-bold tracking-widest uppercase text-sm mb-4 block">
            {subtitle}
          </span>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-neuro-navy mb-6 leading-tight">
            {title}
          </h2>
          <p className="text-gray-600 text-lg mb-8 leading-relaxed">
            {description}
          </p>
          <ul className="space-y-4">
            {features.map((feature, index) => (
              <motion.li 
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex items-center gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-neuro-orange/10 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-neuro-orange" />
                </div>
                <span className="text-gray-700 font-medium">{feature}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Visual Side */}
        <motion.div 
           initial={{ opacity: 0, scale: 0.9 }}
           whileInView={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.8 }}
           viewport={{ once: true }}
           className={`flex-1 relative ${reversed ? "md:order-1" : "md:order-2"}`}
        >
          <div className="relative aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden bg-neuro-navy shadow-2xl group">
             {/* Abstract Graphic Placeholder */}
             <div className="absolute inset-0 bg-gradient-to-br from-neuro-navy via-neuro-navy-light to-gray-900" />
             <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
             
             {/* Floating UI Card Mockup */}
             <motion.div 
               animate={{ y: [0, -10, 0] }}
               transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
               className="absolute inset-0 flex items-center justify-center"
             >
                <div className="w-3/4 h-3/4 glass-panel rounded-2xl border border-white/10 p-6 flex flex-col gap-4">
                   <div className="h-8 w-1/3 bg-white/10 rounded mb-4" />
                   <div className="space-y-3">
                     <div className="h-4 w-full bg-white/5 rounded" />
                     <div className="h-4 w-5/6 bg-white/5 rounded" />
                     <div className="h-4 w-4/6 bg-white/5 rounded" />
                   </div>
                   <div className="mt-auto flex gap-4">
                      <div className="h-20 w-full bg-neuro-orange/20 rounded-xl border border-neuro-orange/30" />
                      <div className="h-20 w-full bg-white/5 rounded-xl border border-white/10" />
                   </div>
                </div>
             </motion.div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
