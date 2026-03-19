"use client";

import { motion } from "framer-motion";

export default function NeuralPulse() {
  return (
    <div className="relative w-full h-[600px] bg-neuro-navy overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-b from-neuro-navy via-neuro-navy-light to-neuro-navy opacity-50" />
      
      {/* Central Node */}
      <div className="relative z-10 flex flex-col items-center">
        <motion.div
           animate={{ scale: [1, 1.1, 1], boxShadow: ["0 0 20px rgba(214,104,41,0.2)", "0 0 60px rgba(214,104,41,0.6)", "0 0 20px rgba(214,104,41,0.2)"] }}
           transition={{ duration: 3, repeat: Infinity }}
           className="w-24 h-24 rounded-full bg-neuro-orange flex items-center justify-center mb-8"
        >
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm" />
        </motion.div>
        
        <h2 className="text-4xl md:text-5xl font-heading font-bold text-white text-center mb-4">
           The Pulse of the Profession
        </h2>
        <p className="text-gray-400 text-center max-w-xl text-lg">
           Real-time connections happening right now across the globe.
        </p>
      </div>

      {/* Orbiting Particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute top-1/2 left-1/2 w-2 h-2 bg-blue-400 rounded-full"
          animate={{
            x: Math.cos(i) * 200,
            y: Math.sin(i) * 200,
            opacity: [0, 1, 0],
            scale: [0.5, 1.5, 0.5]
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
             marginLeft: -4,
             marginTop: -4,
          }}
        />
      ))}
      
      {/* Connecting Lines (SVG) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
        <motion.path
          d="M 0,300 Q 400,100 800,300 T 1600,300"
          fill="none"
          stroke="#D66829"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        />
         <motion.path
          d="M 0,400 Q 400,600 800,400 T 1600,400"
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
        />
      </svg>
    </div>
  );
}
