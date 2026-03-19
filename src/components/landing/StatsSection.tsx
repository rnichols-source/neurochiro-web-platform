"use client";

import { motion } from "framer-motion";

const stats = [
  { value: "50+", label: "Countries" },
  { value: "2,000+", label: "Doctors" },
  { value: "10k+", label: "Students" },
  { value: "1M+", label: "Lives Impacted" },
];

export default function StatsSection() {
  return (
    <section className="py-20 bg-neuro-navy text-white relative overflow-hidden">
      {/* Background Pulse */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[200px] bg-neuro-orange/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="text-4xl md:text-6xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-300 mb-2">
                {stat.value}
              </div>
              <div className="text-neuro-orange font-bold tracking-widest uppercase text-xs">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
