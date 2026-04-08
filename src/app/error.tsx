"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCcw, AlertTriangle, Home, Zap } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Platform Error Boundary:", error);
  }, [error]);

  return (
    <div className="min-h-dvh bg-neuro-cream flex items-center justify-center p-6 font-body">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-white rounded-[3rem] shadow-2xl p-12 text-center border border-neuro-orange/10 relative overflow-hidden"
      >
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-neuro-orange/5 blur-3xl rounded-full -mr-16 -mt-16" />
        
        <div className="relative z-10">
          <div className="w-20 h-20 bg-neuro-orange/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <AlertTriangle className="w-10 h-10 text-neuro-orange" />
          </div>
          
          <h1 className="text-4xl font-heading font-black text-neuro-navy mb-4">
            System Overload
          </h1>
          
          <p className="text-gray-500 text-lg mb-10 leading-relaxed">
            Our nervous system is a bit overloaded—it seems like a neural pathway got crossed. Let's try to reset and regulate.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => reset()}
              className="flex items-center justify-center gap-3 px-8 py-5 bg-neuro-orange text-white font-black uppercase tracking-widest text-sm rounded-2xl hover:bg-neuro-orange-light transition-all shadow-xl shadow-neuro-orange/20 min-h-[56px] min-w-[200px]"
              aria-label="Try to reload the current page"
            >
              <RefreshCcw className="w-5 h-5" /> Reset System
            </button>
            
            <Link
              href="/"
              className="flex items-center justify-center gap-3 px-8 py-5 bg-neuro-navy text-white font-black uppercase tracking-widest text-sm rounded-2xl hover:bg-neuro-navy-light transition-all shadow-xl min-h-[56px] min-w-[200px]"
              aria-label="Go back to the home page"
            >
              <Home className="w-5 h-5" /> Return Home
            </Link>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-center gap-2 text-gray-400">
            <Zap className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Diagnostic ID: {error.digest || "NC-500-INTERNAL"}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
