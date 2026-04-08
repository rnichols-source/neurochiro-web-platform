"use client";

import { motion, useScroll, useTransform, Variants } from "framer-motion";
import Link from "next/link";
import { ChevronDown, Sparkles, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// 🛡️ Performance: Dynamic import the heavy search island
const DynamicLandingSearch = dynamic(() => import("./LandingSearch"), {
  loading: () => <div className="w-full max-w-4xl h-[88px] bg-white/5 animate-pulse rounded-2xl mt-12" />,
  ssr: false
});

export default function Hero() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);
  
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const orbVariants: Variants = {
    animate: {
      scale: [1, 1.1, 1],
      opacity: [0.2, 0.3, 0.2],
      transition: {
        duration: 10,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
    },
    static: {
      scale: 1,
      opacity: 0.2
    }
  };

  return (
    <section className="relative min-h-dvh flex items-center justify-center overflow-hidden bg-neuro-navy text-white">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(30,45,59,1)_0%,rgba(19,25,32,1)_100%)]" />
        
        {/* Background orbs removed for cleaner design */}
      </div>

      {/* Inlined Grid Pattern Overlay - Performance Optimized */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]" 
        style={{ backgroundImage: 'var(--grid-pattern)' }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col items-center text-center">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm"
        >
          <span className="w-2 h-2 rounded-full bg-neuro-orange animate-pulse" aria-hidden="true" />
          <span className="text-sm font-medium tracking-wide text-gray-300 uppercase">The Future of Chiropractic</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-5xl font-heading font-black tracking-tight leading-[1.1] mb-8 drop-shadow-sm text-white"
        >
          The <span className="text-transparent bg-clip-text bg-gradient-to-r from-neuro-orange to-orange-400 drop-shadow-md">Nervous System</span> <br />
          First Ecosystem.
        </motion.h1>

        <DynamicLandingSearch />
      </div>

      {/* Parallax Elements - Disabled on Mobile for Main Thread Relief */}
      {!isMobile && (
        <>
          <motion.div style={{ y: y1 }} className="absolute top-[20%] left-[5%] opacity-20 hidden lg:block" aria-hidden="true">
            <div className="w-24 h-24 border border-white/20 rounded-full flex items-center justify-center">
              <div className="w-16 h-16 border border-neuro-orange/30 rounded-full" />
            </div>
          </motion.div>
          <motion.div style={{ y: y2 }} className="absolute bottom-[20%] right-[5%] opacity-20 hidden lg:block" aria-hidden="true">
             <div className="w-32 h-32 border border-blue-500/20 rounded-full flex items-center justify-center">
               <div className="w-3 h-3 bg-blue-500 rounded-full blur-sm" />
             </div>
          </motion.div>
        </>
      )}

      {/* Floating Smart Match Wizard CTA */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="absolute bottom-12 right-12 z-30 hidden md:block"
      >
        <Link 
          href="/directory?wizard=open"
          className="group flex items-center gap-4 bg-white/10 backdrop-blur-xl border border-white/20 p-2 pl-6 rounded-full hover:bg-white/20 transition-all shadow-2xl min-h-[56px]"
          aria-label="Launch Smart Match Wizard to find the right doctor for you"
        >
          <div className="flex flex-col items-start">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-neuro-orange">Need help?</span>
            <span className="text-sm font-bold text-white">Not sure who to see? <span className="text-gray-400 font-medium ml-1 group-hover:text-white transition-colors">Let us match you.</span></span>
          </div>
          <div className="w-12 h-12 bg-neuro-orange rounded-full flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6 fill-current" aria-hidden="true" />
          </div>
        </Link>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-gray-500 flex flex-col items-center gap-2"
        aria-hidden="true"
      >
        <span className="text-xs uppercase tracking-widest">Explore</span>
        <ChevronDown className="w-5 h-5 animate-bounce" />
      </motion.div>
    </section>
  );
}
