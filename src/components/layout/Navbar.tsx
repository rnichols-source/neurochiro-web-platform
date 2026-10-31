"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ChevronDown, User } from "lucide-react";
import RegionSwitcher from "./RegionSwitcher";
import { CartButton } from "@/components/store/CartButton";
import NotificationBell from "./NotificationBell";
import { createClient } from "@/lib/supabase";

const PATIENT_LINKS = [
  { name: "Find a doctor", href: "/directory" },
  { name: "Learn", href: "/learn" },
  { name: "Take the quiz", href: "/quiz" },
];

const CHIRO_LINKS = [
  { name: "Membership", href: "/pro?source=nav" },
  { name: "Seminars", href: "/seminars" },
  { name: "Marketplace", href: "/marketplace" },
  { name: "Careers", href: "/jobs" },
  { name: "Store", href: "/store" },
];

const MOBILE_PATIENT_LINKS = [
  { name: "Find a doctor", href: "/directory" },
  { name: "Take the 60-second quiz", href: "/quiz" },
  { name: "What is nervous system chiropractic?", href: "/learn/foundations" },
  { name: "FAQ", href: "/learn/faq" },
  { name: "Join the patient list", href: "/list?source=nav" },
];

type SessionUser = { id: string };

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const [chiroPath, setChiroPath] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const pathname = usePathname();
  const chiroRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) setUser(data.user ? { id: data.user.id } : null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id } : null);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (menuPath && menuPath !== pathname) setMenuPath(null);
  if (chiroPath && chiroPath !== pathname) setChiroPath(null);
  const mobileMenuOpen = menuPath === pathname;
  const chiroOpen = chiroPath === pathname;

  useEffect(() => {
    if (!chiroOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (chiroRef.current && !chiroRef.current.contains(event.target as Node)) setChiroPath(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setChiroPath(null);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [chiroOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const root = menuRef.current;
    const focusable = () =>
      Array.from(root?.querySelectorAll<HTMLElement>("a, button, input, [tabindex]:not([tabindex='-1'])") || []);
    const nodes = focusable();
    nodes[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuPath(null);
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileMenuOpen]);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.replace("/");
  };

  const isDirectoryPage = pathname === "/directory";
  const linkClass = "inline-flex min-h-11 items-center text-sm font-bold text-gray-300 hover:text-white";

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
          isDirectoryPage ? "hidden lg:block" : ""
        } ${isScrolled ? "border-b border-white/10 bg-neuro-navy/95 py-3 shadow-xl backdrop-blur-md" : "bg-neuro-navy py-4"}`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 md:px-8">
          <Link href="/" className="flex min-h-11 items-center gap-3">
            <Image src="/logo-white.png" alt="NeuroChiro" width={40} height={40} className="object-contain" priority />
            <span className="font-heading text-xl font-black tracking-tight text-white">
              NEURO<span className="text-neuro-orange-light">CHIRO</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {PATIENT_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={`${linkClass} px-2 ${pathname === link.href ? "text-white" : ""}`}>
                {link.name}
              </Link>
            ))}
            <div className="relative" ref={chiroRef}>
              <button
                type="button"
                className={`${linkClass} gap-1 px-2`}
                aria-expanded={chiroOpen}
                aria-controls="chiro-menu"
                onClick={() => setChiroPath(chiroOpen ? null : pathname)}
              >
                For chiropractors
                <ChevronDown className={`h-4 w-4 transition-transform ${chiroOpen ? "rotate-180" : ""}`} aria-hidden />
              </button>
              {chiroOpen && (
                <div id="chiro-menu" className="absolute right-0 top-full z-[120] mt-2 w-64 rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl">
                  {CHIRO_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex min-h-11 items-center rounded-xl px-3 text-sm font-bold text-neuro-navy hover:bg-gray-50"
                      onClick={() => setChiroPath(null)}
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <CartButton />
            <RegionSwitcher />
            {user ? (
              <>
                <Link href="/dashboard" className="inline-flex min-h-11 items-center px-2 text-sm font-bold text-white hover:text-neuro-orange-light">
                  Dashboard
                </Link>
                <NotificationBell />
                <button type="button" onClick={signOut} className="inline-flex min-h-11 items-center px-2 text-sm font-bold text-white">
                  Sign out
                </button>
              </>
            ) : (
              <Link href="/login" className="inline-flex min-h-11 items-center px-2 text-sm font-bold text-white">
                Log in
              </Link>
            )}
            <Link href="/directory" className="inline-flex h-11 items-center rounded-full bg-neuro-orange-ink px-4 text-sm font-bold text-white">
              Find a doctor
            </Link>
          </div>

          <div className="flex items-center lg:hidden">
            <CartButton />
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="site-menu"
              className="relative z-10 flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-white"
              onClick={() => setMenuPath(pathname)}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            ref={menuRef}
            id="site-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[300] flex flex-col bg-neuro-navy text-white"
          >
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <Link href="/" className="flex items-center gap-3">
                <Image src="/logo-white.png" alt="" width={32} height={32} className="object-contain" />
                <span className="font-heading text-xl font-black tracking-tight">
                  NEURO<span className="text-neuro-orange-light">CHIRO</span>
                </span>
              </Link>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMenuPath(null)}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/10"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 space-y-8 overflow-y-auto p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-300">For patients</p>
                <div className="mt-2">
                  {MOBILE_PATIENT_LINKS.map((link) => (
                    <Link key={link.href} href={link.href} className="flex min-h-11 items-center text-base font-bold text-white">
                      {link.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-300">For chiropractors</p>
                <div className="mt-2">
                  {CHIRO_LINKS.map((link) => (
                    <Link key={link.href} href={link.href} className="flex min-h-11 items-center text-base font-bold text-gray-300">
                      {link.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t border-white/10 p-6">
              <RegionSwitcher labeled />
              {user ? (
                <div className="flex gap-2">
                  <Link href="/dashboard" className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-white/10 text-sm font-bold">
                    Dashboard
                  </Link>
                  <button type="button" onClick={signOut} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-white/10 text-sm font-bold">
                    Sign out
                  </button>
                </div>
              ) : (
                <Link href="/login" className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white/10 text-sm font-bold">
                  <User className="h-5 w-5" aria-hidden /> Log in
                </Link>
              )}
              <Link href="/directory" className="flex h-[52px] items-center justify-center rounded-xl bg-neuro-orange-ink text-base font-bold text-white">
                Find a doctor
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
