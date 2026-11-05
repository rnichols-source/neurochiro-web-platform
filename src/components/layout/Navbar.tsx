"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ChevronDown, User } from "lucide-react";
import RegionSwitcher from "./RegionSwitcher";
import { CartButton } from "@/components/store/CartButton";
import NotificationBell from "./NotificationBell";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { LocaleLink as Link } from "@/i18n/LocaleLink";
import { localizePath, splitLocalePrefix } from "@/i18n/config";
import { useDictionary, useLocale } from "@/i18n/locale-context";
import type { Dictionary } from "@/i18n/dictionaries";
import { createClient } from "@/lib/supabase";

function joinLabel(label: string, t: Dictionary) {
  if (label === "Apply to join") return t.nav.applyToJoin;
  if (label === "Join as a doctor") return t.nav.joinAsDoctor;
  if (label === "Join NeuroChiro") return t.nav.joinNeuroChiro;
  return label;
}

type SessionUser = { id: string };

const JOIN_HREF = "/get-started?source=nav_join";
const JOIN_MENU_HREF = "/get-started?source=nav_dropdown";

export default function Navbar({
  joinCtaLabel,
  joinMenuLabel,
}: {
  joinCtaLabel: string;
  joinMenuLabel: string;
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const [chiroPath, setChiroPath] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const pathname = usePathname();
  const locale = useLocale();
  const t = useDictionary();
  const barePath = splitLocalePrefix(pathname || "/").pathname;
  const joinCta = joinLabel(joinCtaLabel, t);
  const joinMenu = joinLabel(joinMenuLabel, t);
  const patientLinks = [
    { name: t.nav.findShort, href: "/directory" },
    { name: t.nav.learn, href: "/learn" },
    { name: t.nav.quiz, href: "/quiz?source=navbar" },
  ];
  const mobilePatientLinks = [
    { name: t.nav.findDoctor, href: "/directory" },
    { name: t.nav.quizLong, href: "/quiz?source=navbar" },
    { name: t.nav.whatIs, href: "/learn/foundations" },
    { name: t.nav.faq, href: "/learn/faq" },
    { name: t.nav.patientList, href: "/list?source=nav" },
  ];
  const chiroMenu = [
    { name: joinMenu, href: JOIN_MENU_HREF },
    { name: t.nav.membership, href: "/pro?source=nav" },
    { name: t.nav.seminars, href: "/seminars" },
    { name: t.nav.marketplace, href: "/marketplace" },
    { name: t.nav.careers, href: "/jobs" },
    { name: t.nav.store, href: "/store" },
  ];
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
    window.location.replace(localizePath("/", locale));
  };

  const isDirectoryPage = barePath === "/directory";
  const linkClass = "inline-flex min-h-11 shrink-0 items-center whitespace-nowrap text-sm font-bold text-gray-300 hover:text-white";
  const chiroLinks = chiroMenu;
  const joinButtonClass =
    "inline-flex h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full border-2 border-white/80 bg-transparent px-4 text-sm font-bold text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
          isDirectoryPage ? "hidden lg:block" : ""
        } ${isScrolled ? "border-b border-white/10 bg-neuro-navy/95 py-3 shadow-xl backdrop-blur-md" : "bg-neuro-navy py-4"}`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 md:px-8">
          <Link href="/" className="flex min-h-11 shrink-0 items-center gap-3">
            <Image src="/logo-white.png" alt="" width={40} height={40} className="object-contain" priority />
            <span className="font-heading text-xl font-black tracking-tight text-white">
              NEURO<span className="text-neuro-orange-light">CHIRO</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label={t.nav.primary}>
            {patientLinks.map((link) => (
              <Link key={link.href} href={link.href} className={`${linkClass} px-2 ${barePath === link.href.split("?")[0] ? "text-white" : ""}`}>
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
                {t.nav.forChiropractors}
                <ChevronDown className={`h-4 w-4 transition-transform ${chiroOpen ? "rotate-180" : ""}`} aria-hidden />
              </button>
              {chiroOpen && (
                <div id="chiro-menu" className="absolute right-0 top-full z-[120] mt-2 w-64 rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl">
                  {chiroLinks.map((link, index) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex min-h-11 items-center rounded-xl px-3 text-sm font-bold hover:bg-gray-50 ${
                        index === 0 ? "text-neuro-orange-ink" : "text-neuro-navy"
                      }`}
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
            <LanguageSwitcher />
            <CartButton />
            <RegionSwitcher />
            {user ? (
              <>
                <Link href="/dashboard" className="inline-flex min-h-11 items-center px-2 text-sm font-bold text-white hover:text-neuro-orange-light">
                  {t.nav.dashboard}
                </Link>
                <NotificationBell />
                <button type="button" onClick={signOut} className="inline-flex min-h-11 items-center px-2 text-sm font-bold text-white">
                  {t.nav.signOut}
                </button>
              </>
            ) : (
              <Link href="/login" className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap px-2 text-sm font-bold text-white">
                {t.nav.logIn}
              </Link>
            )}
            <Link href={JOIN_HREF} className={joinButtonClass}>
              {joinCta}
            </Link>
            <Link href="/directory" className="inline-flex h-11 shrink-0 items-center whitespace-nowrap rounded-full bg-neuro-orange-ink px-4 text-sm font-bold text-white">
              {t.nav.findDoctor}
            </Link>
          </div>

          <div className="flex items-center lg:hidden">
            <CartButton />
            <button
              type="button"
              aria-label={t.nav.openMenu}
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
            aria-label={t.nav.menu}
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
                aria-label={t.nav.closeMenu}
                onClick={() => setMenuPath(null)}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/10"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 space-y-8 overflow-y-auto p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-300">{t.nav.forPatients}</p>
                <div className="mt-2">
                  {mobilePatientLinks.map((link) => (
                    <Link key={link.href} href={link.href} className="flex min-h-11 items-center text-base font-bold text-white">
                      {link.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-300">{t.nav.forChiropractors}</p>
                <div className="mt-2">
                  {chiroLinks.map((link, index) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex min-h-11 items-center text-base font-bold ${index === 0 ? "text-white" : "text-gray-300"}`}
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t border-white/10 p-6">
              <LanguageSwitcher />
              <RegionSwitcher labeled />
              {user ? (
                <div className="flex gap-2">
                  <Link href="/dashboard" className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-white/10 text-sm font-bold">
                    {t.nav.dashboard}
                  </Link>
                  <button type="button" onClick={signOut} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-white/10 text-sm font-bold">
                    {t.nav.signOut}
                  </button>
                </div>
              ) : (
                <Link href="/login" className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white/10 text-sm font-bold">
                  <User className="h-5 w-5" aria-hidden /> {t.nav.logIn}
                </Link>
              )}
              <Link
                href={JOIN_HREF}
                className="flex min-h-11 items-center justify-center rounded-xl border-2 border-white px-4 text-base font-bold text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {joinCta}
              </Link>
              <Link href="/directory" className="flex h-[52px] items-center justify-center rounded-xl bg-neuro-orange-ink text-base font-bold text-white">
                {t.nav.findDoctor}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
