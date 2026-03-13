"use client";

import React, { useState } from 'react';
import { Copy, Check, ShieldCheck, ExternalLink, Code } from 'lucide-react';

interface VerifiedBadgeProps {
  doctorSlug: string;
  doctorName: string;
}

export default function VerifiedBadge({ doctorSlug, doctorName }: VerifiedBadgeProps) {
  const [copied, setCopy] = useState(false);
  
  const embedCode = `<a href="https://neurochiro.com/directory/${doctorSlug}" target="_blank" rel="noopener noreferrer">
  <img loading="lazy" decoding="async" src="https://neurochiro.com/api/badge/${doctorSlug}" alt="Verified NeuroChiro Provider - ${doctorName}" width="150" height="150" style="border:none;" />
</a>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopy(true);
    setTimeout(() => setCopy(false), 2000);
  };

  return (
    <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-neuro-orange/5 blur-[100px] -mr-32 -mt-32"></div>
      
      <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-center">
        {/* Visual Preview */}
        <div className="w-full lg:w-1/3 flex flex-col items-center justify-center p-8 bg-neuro-cream rounded-3xl border border-gray-100 relative group">
          <div className="absolute top-4 left-4">
             <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Live Preview</span>
          </div>
          
          {/* Stylized Badge (Mocking the API response) */}
          <div className="w-40 h-40 rounded-full bg-neuro-navy flex flex-col items-center justify-center text-center p-4 border-4 border-neuro-orange shadow-2xl transform group-hover:scale-105 transition-transform duration-500">
             <ShieldCheck className="w-10 h-10 text-neuro-orange mb-2" />
             <span className="text-[10px] font-black text-white uppercase tracking-tighter leading-none">Verified</span>
             <span className="text-[12px] font-black text-neuro-orange uppercase tracking-widest mb-1">Provider</span>
             <div className="w-8 h-px bg-white/20 my-1"></div>
             <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">NeuroChiro</span>
          </div>
          
          <p className="mt-6 text-[10px] text-gray-400 font-medium text-center">This badge links directly to your <br/>NeuroChiro clinical profile.</p>
        </div>

        {/* Content & Code */}
        <div className="flex-1 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Code className="w-5 h-5 text-neuro-orange" />
              <h3 className="text-2xl font-heading font-black text-neuro-navy uppercase tracking-tight">Your Instant Authority Kit is Ready</h3>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xl">
              Boost your SEO and build patient trust by displaying your <span className="font-bold text-neuro-navy">Verified Provider</span> badge on your clinic's website. This provides a high-authority backlink that strengthens your search ranking.
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Embed Code (HTML)</label>
            <div className="relative group">
              <pre className="bg-neuro-navy p-6 rounded-2xl text-blue-300 text-xs font-mono overflow-x-auto border border-white/10 shadow-inner max-h-32">
                {embedCode}
              </pre>
              <button 
                onClick={handleCopy}
                className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-neuro-orange text-white rounded-xl transition-all backdrop-blur-md border border-white/10 flex items-center gap-2 group/btn"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span className="text-[10px] font-black uppercase tracking-widest overflow-hidden w-0 group-hover/btn:w-12 transition-all">
                  {copied ? "Copied" : "Copy"}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">SEO Optimized</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dynamic Sizing</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Instant Trust</span>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
