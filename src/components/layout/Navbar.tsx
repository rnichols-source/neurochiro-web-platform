"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, User, Stethoscope, GraduationCap, Zap, MapPin, BookOpen, Crown, Users, Briefcase, Store, Calendar, Sparkles, Bell, Heart } from "lucide-react";

import RegionSwitcher from "./RegionSwitcher";
import GetStartedModal from "./GetStartedModal";
import NotificationBell from "./NotificationBell";
import { createClient } from "@/lib/supabase";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isGetStartedOpen, setIsGetStartedOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();
  const supabase = createClient();

  // Handle scroll effect for glass-morphism
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Check auth status
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: "Find a Doctor", href: "/directory", icon: MapPin },
    { name: "Seminars", href: "/seminars", icon: Calendar },
    { name: "Why NeuroChiro?", href: "/why-neurochiro", icon: Zap },
    { name: "About", href: "/about", icon: Users },
    { name: "Careers", href: "/careers", icon: Briefcase },
  ];

  // Determine if we should use white text based on scroll state and current page
  // Always use white text on dark navy navbar
  const useWhiteText = true;

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
          isScrolled
            ? "bg-neuro-navy/95 backdrop-blur-md border-b border-white/10 py-4 shadow-xl"
            : "bg-neuro-navy py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-8 flex items-center justify-between">
          
          {/* Logo */}
          <div>
            <Link href="/" className="flex items-center gap-3 group">
              <Image 
                src={useWhiteText ? "/logo-white.png" : "/logo.png"} 
                alt="NeuroChiro Logo" 
                width={40}
                height={40}
                className="object-contain group-hover:scale-105 transition-transform"
                priority
              />
              <span className={`font-heading font-black text-xl tracking-tight transition-colors ${useWhiteText ? 'text-white' : 'text-neuro-navy'}`}>
                NEURO<span className="text-neuro-orange">CHIRO</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href}
                className={`text-xs xl:text-sm font-bold tracking-wide transition-colors flex items-center gap-2 hover:text-neuro-orange ${
                  pathname === link.href
                    ? "text-neuro-orange" 
                    : useWhiteText ? "text-gray-300" : "text-neuro-navy/80"
                }`}
              >
                {link.name}
              </Link>
            ))}

            {/* Dropdown: Join the Network */}
            <div className="relative group">
              <button className={`text-xs xl:text-sm font-bold tracking-wide transition-colors flex items-center gap-1 hover:text-neuro-orange ${useWhiteText ? "text-gray-300" : "text-neuro-navy/80"}`}>
                Join <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute top-full right-0 pt-4 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all">
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 w-64 overflow-hidden">
                  <Link href="/pricing/doctors" className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                    <div className="p-2 bg-neuro-orange/10 rounded-lg text-neuro-orange"><Stethoscope className="w-4 h-4" /></div>
                    <div>
                      <p className="text-sm font-bold text-neuro-navy">I&apos;m a Doctor</p>
                      <p className="text-xs text-gray-500">Get listed in the directory</p>
                    </div>
                  </Link>
                  <Link href="/pricing/students" className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors border-t border-gray-100 mt-1">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><GraduationCap className="w-4 h-4" /></div>
                    <div>
                      <p className="text-sm font-bold text-blue-900">I&apos;m a Student</p>
                      <p className="text-xs text-gray-500">Jobs, seminars &amp; career tools</p>
                    </div>
                  </Link>
                  <Link href="/register?role=patient" className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors border-t border-gray-100 mt-1">
                    <div className="p-2 bg-red-50 rounded-lg text-red-500"><Heart className="w-4 h-4" /></div>
                    <div>
                      <p className="text-sm font-bold text-red-900">I&apos;m a Patient</p>
                      <p className="text-xs text-gray-500">Track health &amp; find specialists</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </nav>

          {/* Auth Actions */}
          <div className="hidden lg:flex items-center gap-4">
            <RegionSwitcher />
            
            {user ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className={`text-sm font-bold transition-colors hover:text-neuro-orange ${useWhiteText ? "text-white" : "text-neuro-navy"}`}
                >
                  Dashboard
                </Link>
                <NotificationBell />
                <div className="relative group/user">
                  <Link 
                    href="/dashboard" 
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      useWhiteText ? 'border-white/20 hover:border-white bg-white/10' : 'border-gray-200 hover:border-neuro-navy bg-gray-50'
                    }`}
                  >
                    <User className={`w-5 h-5 ${useWhiteText ? 'text-white' : 'text-neuro-navy'}`} />
                  </Link>
                  {/* Dropdown for Logged In User */}
                  <div className="absolute top-full right-0 pt-4 opacity-0 translate-y-2 pointer-events-none group-hover/user:opacity-100 group-hover/user:translate-y-0 group-hover/user:pointer-events-auto transition-all z-[110]">
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 w-52 overflow-hidden">
                      <Link 
                        href="/dashboard" 
                        className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-xl transition-all text-sm font-bold text-neuro-navy active:scale-95"
                      >
                        <div className="w-8 h-8 rounded-lg bg-neuro-orange/10 flex items-center justify-center text-neuro-orange">
                          <Zap className="w-4 h-4" />
                        </div>
                        My Dashboard
                      </Link>
                      <button 
                        onClick={async () => {
                          console.log("Signing out...");
                          await supabase.auth.signOut();
                          window.location.replace('/');
                        }}
                        className="w-full flex items-center gap-3 p-4 hover:bg-red-50 rounded-xl transition-all text-sm font-bold text-red-600 border-t border-gray-50 mt-1 active:scale-95"
                      >
                        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                          <X className="w-4 h-4" />
                        </div>
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className={`text-sm font-bold transition-colors hover:text-neuro-orange ${useWhiteText ? "text-white" : "text-neuro-navy"}`}
                >
                  Log In
                </Link>
                <button 
                  onClick={() => setIsGetStartedOpen(true)}
                  className="px-6 py-2.5 bg-neuro-orange hover:bg-neuro-orange-light active:scale-95 text-white font-black text-xs uppercase tracking-widest rounded-full shadow-lg shadow-neuro-orange/20 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Join Network
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className={`lg:hidden p-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg ${useWhiteText ? 'text-white' : 'text-neuro-navy'}`}
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      <GetStartedModal 
        isOpen={isGetStartedOpen} 
        onClose={() => setIsGetStartedOpen(false)} 
      />

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[300] bg-neuro-navy text-white flex flex-col"
          >
            <div className="p-6 flex justify-between items-center border-b border-white/10">
              <div className="flex items-center gap-3">
                <Image src="/logo-white.png" alt="NeuroChiro" width={32} height={32} className="object-contain" />
                <span className="font-heading font-black text-xl tracking-tight">
                  NEURO<span className="text-neuro-orange">CHIRO</span>
                </span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="space-y-4">
                <p className="text-xs font-black uppercase tracking-widest text-gray-500">Explore</p>
                {navLinks.map((link) => (
                  <Link key={link.name} href={link.href} className="flex items-center gap-4 text-2xl font-bold">
                    <link.icon className="w-6 h-6 text-neuro-orange" /> {link.name}
                  </Link>
                ))}
              </div>

              <div className="space-y-4 pt-8 border-t border-white/10">
                <p className="text-xs font-black uppercase tracking-widest text-gray-500">Join the Network</p>
                <Link href="/pricing/doctors" className="flex items-center gap-4 text-xl font-bold text-gray-300">
                  <Stethoscope className="w-5 h-5 text-neuro-orange" /> I&apos;m a Doctor
                </Link>
                <Link href="/pricing/students" className="flex items-center gap-4 text-xl font-bold text-gray-300">
                  <GraduationCap className="w-5 h-5 text-blue-500" /> I&apos;m a Student
                </Link>
                <Link href="/register?role=patient" className="flex items-center gap-4 text-xl font-bold text-gray-300">
                  <Heart className="w-5 h-5 text-red-500" /> I&apos;m a Patient
                </Link>
              </div>
            </div>

            <div className="p-8 bg-white/5 border-t border-white/10 space-y-4 text-center">
              <div className="flex justify-center mb-4">
                <RegionSwitcher />
              </div>
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsGetStartedOpen(true);
                }}
                className="w-full py-4 bg-neuro-orange text-white font-black uppercase tracking-widest text-sm rounded-xl shadow-lg"
              >
                Join the Network
              </button>
              <Link href="/login" className="w-full py-4 bg-white/10 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                <User className="w-5 h-5" /> Log In to Dashboard
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
