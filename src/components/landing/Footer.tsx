"use client";

import { useState } from "react";
import Link from "next/link";
import { Twitter, Instagram, Linkedin, Github } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

export default function Footer() {
  return (
    <footer className="bg-neuro-black text-white py-24 px-6 border-t border-white/10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
        
        {/* Brand */}
        <div className="space-y-6">
          <Link href="/" className="text-2xl font-heading font-black tracking-tight flex items-center gap-3 hover:text-neuro-orange transition-colors">
            <div className="relative w-10 h-10">
              <Image src="/logo-white.png" alt="NeuroChiro" fill className="object-contain" />
            </div>
            <span>NEURO<span className="text-neuro-orange">CHIRO</span></span>
          </Link>
          <p className="text-gray-400 leading-relaxed max-w-sm">
            The global nervous-system-first chiropractic ecosystem. Connecting doctors, students, and patients worldwide.
          </p>
          <div className="flex gap-4">
            <Link href="https://twitter.com/neurochiro" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors" aria-label="Follow NeuroChiro on Twitter"><Twitter className="w-5 h-5" aria-hidden="true" /></Link>
            <Link href="https://instagram.com/neurochiro" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors" aria-label="Follow NeuroChiro on Instagram"><Instagram className="w-5 h-5" aria-hidden="true" /></Link>
            <Link href="https://linkedin.com/company/neurochiro" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors" aria-label="Follow NeuroChiro on LinkedIn"><Linkedin className="w-5 h-5" aria-hidden="true" /></Link>
          </div>
        </div>

        {/* Links Column 1 */}
        <div>
          <h4 className="font-bold text-lg mb-6 text-gray-200">Product</h4>
          <ul className="space-y-4">
            <li><Link href="/directory" className="text-gray-400 hover:text-neuro-orange transition-colors">Global Directory</Link></li>
            <li><Link href="/register?role=student" className="text-gray-400 hover:text-neuro-orange transition-colors">For Students</Link></li>
            <li><Link href="/register?role=doctor" className="text-gray-400 hover:text-neuro-orange transition-colors">For Doctors</Link></li>
            <li><Link href="/seminars" className="text-gray-400 hover:text-neuro-orange transition-colors">Seminars Hub</Link></li>
            <li><Link href="/host-a-seminar" className="text-gray-400 hover:text-neuro-orange transition-colors">Host a Seminar</Link></li>
          </ul>
        </div>

        {/* Links Column 2 */}
        <div>
          <h4 className="font-bold text-lg mb-6 text-gray-200">Resources</h4>
          <ul className="space-y-4">
            <li><Link href="/careers" className="text-gray-400 hover:text-neuro-orange transition-colors">Careers</Link></li>
            <li><Link href="/about" className="text-gray-400 hover:text-neuro-orange transition-colors">About Us</Link></li>
            <li><Link href="/contact" className="text-gray-400 hover:text-neuro-orange transition-colors">Contact</Link></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className="font-bold text-lg mb-6 text-gray-200">Stay Updated</h4>
          <p className="text-gray-400 mb-4 text-sm">Join our newsletter for the latest updates and clinical insights.</p>
          <NewsletterForm />
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
        <p>© 2026 NeuroChiro Directory. All rights reserved.</p>
        <div className="flex gap-8 mt-4 md:mt-0">
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}

function NewsletterForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    // Simulated submission
    await new Promise(resolve => setTimeout(resolve, 800));
    setStatus('success');
  };

  if (status === 'success') {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-emerald-400 text-sm font-bold"
      >
        Welcome to the network!
      </motion.div>
    );
  }

  return (
    <form className="flex gap-2" onSubmit={handleSubmit}>
      <input 
        type="email" 
        required
        placeholder="Enter your email" 
        className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 w-full text-white placeholder-gray-500 focus:outline-none focus:border-neuro-orange transition-colors"
      />
      <button 
        type="submit"
        disabled={status === 'loading'}
        className="bg-neuro-orange hover:bg-neuro-orange-light active:scale-95 disabled:opacity-50 px-4 py-3 rounded-lg font-bold text-white transition-all"
        aria-label="Join newsletter"
      >
        {status === 'loading' ? '...' : 'Join'}
      </button>
    </form>
  );
}
