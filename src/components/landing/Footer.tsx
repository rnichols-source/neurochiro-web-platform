"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Instagram, Linkedin } from "lucide-react";

const PATIENT_LINKS = [
  { name: "Find a doctor", href: "/directory" },
  { name: "Take the quiz", href: "/quiz" },
  { name: "Learn", href: "/learn" },
  { name: "FAQ", href: "/learn/faq" },
  { name: "Patient list", href: "/list?source=site_footer" },
];

const CHIRO_LINKS = [
  { name: "Membership", href: "/pro?source=site_footer" },
  { name: "Seminars", href: "/seminars" },
  { name: "Marketplace", href: "/marketplace" },
  { name: "Careers", href: "/jobs" },
  { name: "Store", href: "/store" },
  { name: "Students", href: "/students" },
  { name: "Log in", href: "/login" },
];

const COMPANY_LINKS = [
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
  { name: "Privacy", href: "/privacy" },
  { name: "Terms", href: "/terms" },
];

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function Column({ title, links }: { title: string; links: { name: string; href: string }[] }) {
  return (
    <div>
      <h2 className="text-base font-bold text-gray-200">{title}</h2>
      <ul className="mt-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="inline-flex min-h-11 items-center py-2 text-sm text-gray-400 hover:text-white">
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/10 bg-neuro-black px-4 py-12 text-white sm:px-6">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="inline-flex min-h-11 items-center gap-3">
            <Image src="/logo-white.png" alt="" width={40} height={40} className="object-contain" />
            <span className="font-heading text-xl font-black tracking-tight">
              NEURO<span className="text-neuro-orange-light">CHIRO</span>
            </span>
          </Link>
          <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-gray-400">
            A free directory of verified nervous system chiropractors.
          </p>
          <div className="mt-4 flex gap-2">
            <Link href="https://twitter.com/neurochiro" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5" aria-label="Follow NeuroChiro on X">
              <XIcon />
            </Link>
            <Link href="https://instagram.com/neurochiro" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5" aria-label="Follow NeuroChiro on Instagram">
              <Instagram className="h-5 w-5" aria-hidden />
            </Link>
            <Link href="https://linkedin.com/company/neurochiro" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5" aria-label="Follow NeuroChiro on LinkedIn">
              <Linkedin className="h-5 w-5" aria-hidden />
            </Link>
          </div>
        </div>
        <Column title="For patients" links={PATIENT_LINKS} />
        <Column title="For chiropractors" links={CHIRO_LINKS} />
        <div>
          <h2 className="text-base font-bold text-gray-200">Company</h2>
          <ul className="mt-2">
            {COMPANY_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="inline-flex min-h-11 items-center py-2 text-sm text-gray-400 hover:text-white">
                  {link.name}
                </Link>
              </li>
            ))}
            <li>
              <a href="mailto:support@neurochirodirectory.com" className="inline-flex min-h-11 items-center py-2 text-sm text-gray-400 hover:text-white">
                Feedback
              </a>
            </li>
          </ul>
          <h2 className="mt-6 text-base font-bold text-gray-200">Stay updated</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-400">Get updates when new doctors join near you.</p>
          <NewsletterForm />
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-6xl flex-col gap-3 border-t border-white/10 pt-6 text-sm text-gray-400 sm:flex-row sm:items-center sm:justify-between">
        <p>© {year} NeuroChiro</p>
        <div className="flex gap-4">
          <Link href="/privacy" className="inline-flex min-h-11 items-center hover:text-white">Privacy</Link>
          <Link href="/terms" className="inline-flex min-h-11 items-center hover:text-white">Terms</Link>
        </div>
      </div>
      <p className="mx-auto mt-2 max-w-6xl text-xs text-gray-300">
        Postal code data from{" "}
        <a href="https://www.geonames.org" className="underline hover:text-white" target="_blank" rel="noopener noreferrer">
          GeoNames
        </a>{" "}
        (geonames.org), CC BY 4.0.
      </p>
    </footer>
  );
}

function NewsletterForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [email, setEmail] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "footer_newsletter", role: "subscriber" }),
      });
    } catch {
      /* still confirm so a network blip does not trap the form */
    }
    setStatus("success");
  };

  if (status === "success") {
    return <p className="mt-3 text-sm font-bold text-emerald-300">You&apos;re on the list.</p>;
  }

  return (
    <form className="mt-3 flex gap-2" onSubmit={handleSubmit}>
      <label htmlFor="footer-email" className="sr-only">Email</label>
      <input
        id="footer-email"
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email address"
        className="min-h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-base text-white placeholder:text-gray-500 focus:border-neuro-orange-light focus:outline-none"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="min-h-11 shrink-0 rounded-lg bg-neuro-orange-ink px-4 text-sm font-bold text-white disabled:opacity-50"
      >
        {status === "loading" ? "..." : "Join"}
      </button>
    </form>
  );
}
