"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const STRIPE_MONTHLY = process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY || "";
const STRIPE_ANNUAL = process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL || "";
const FIT_CALL_LINK = process.env.NEXT_PUBLIC_FIT_CALL_LINK || "";

export default function ProPage() {
  return (
    <Suspense>
      <ProPageContent />
    </Suspense>
  );
}

function ProPageContent() {
  const searchParams = useSearchParams();
  const source = searchParams.get("source") || "direct";
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const monthlyLink = STRIPE_MONTHLY ? `${STRIPE_MONTHLY}${STRIPE_MONTHLY.includes("?") ? "&" : "?"}client_reference_id=pro_${source}` : "#";
  const annualLink = STRIPE_ANNUAL ? `${STRIPE_ANNUAL}${STRIPE_ANNUAL.includes("?") ? "&" : "?"}client_reference_id=pro_${source}` : "#";
  const fitCallLink = FIT_CALL_LINK || "#";

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@500;700;800&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap');
    .pro-page {
      --navy: #1E2D3B; --orange: #D66829; --paper: #F7F5F1; --card: #FFFFFF;
      --ink: #1E2D3B; --muted: #5C6773; --line: #E3DCD2; --band: #16222D;
      --band-ink: #F3EFE9; --band-muted: #93A0AC;
    }
    @media (prefers-color-scheme: dark) {
      .pro-page {
        --paper: #131E27; --card: #1A2833; --ink: #F1EDE7; --muted: #A5B0BB;
        --line: #2A3B49; --band: #0D161D; --band-ink: #F1EDE7;
      }
    }
  `;

  const faqs = [
    { q: "Is $99 a month worth it if I'm already busy?", a: "If your schedule is full and you never want another new patient, probably not. Most doctors joining aren't short on patients in general, they're short on the right ones: people who understand nervous system care before they walk in. That's who searches this directory." },
    { q: "How many patients will I get?", a: "I don't know, and anyone who gives you a number is guessing. It depends on how many people search your area and how fast you respond when one reaches out. What I'd judge it on: a year of content in your own folder, plus a listing in front of patients specifically looking for how you practice." },
    { q: "How much of my time does this take?", a: "One 30-minute onboarding call and two interviews. That's it. The editing, scheduling, and posting are on us." },
    { q: "What if I want out?", a: "Cancel anytime by email. You stay active through the period you already paid for, and the clips already in your folder stay yours." },
    { q: "Nobody's searching my city yet. Why join now?", a: "Then you're the first name in it when they do. We're building a patient list by ZIP code, and when someone in your area is waiting, they hear about you. Early listings also get the most content while the roster is small." },
    { q: "Who gets in?", a: "Licensed chiropractors practicing with a nervous system focus. Every doctor applies and I review them before they're listed. If you're not a fit, I'll tell you." },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="pro-page" style={{ background: "var(--paper)", color: "var(--ink)", fontFamily: '"Source Serif 4", Georgia, "Times New Roman", serif', fontSize: 17, lineHeight: 1.65, margin: 0 }}>

        {/* HEADER / HERO */}
        <header style={{ background: "var(--band)", color: "var(--band-ink)", padding: "58px 0 52px" }}>
          <div style={{ maxWidth: 660, margin: "0 auto", padding: "0 22px" }}>
            <div style={{ fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 15, letterSpacing: "0.04em", marginBottom: 42 }}>
              <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
                NEURO<b style={{ color: "var(--orange)", fontWeight: 800 }}>CHIRO</b>
              </Link>
            </div>
            <h1 style={{ fontFamily: "Archivo, sans-serif", fontSize: "clamp(31px, 6vw, 38px)", lineHeight: 1.08, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 18px" }}>
              Patients are already searching for a chiropractor who practices the way you do.
            </h1>
            <p style={{ color: "var(--band-muted)", fontSize: 18, maxWidth: "30em", margin: "0 0 16px" }}>
              NeuroChiro is the directory that puts you in front of them, and a content engine that keeps you in front of them all year.
            </p>

            {/* MATH BLOCK */}
            <div style={{ margin: "40px 0 8px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 14, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,.12)" }}>
                <div style={{ fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: "clamp(28px, 5vw, 34px)", letterSpacing: "-0.03em", minWidth: "clamp(104px, 20vw, 132px)" }}>$99</div>
                <span style={{ color: "var(--band-muted)", fontSize: 16 }}>per month, cancel anytime</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 14, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,.12)" }}>
                <div style={{ fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: "clamp(28px, 5vw, 34px)", letterSpacing: "-0.03em", minWidth: "clamp(104px, 20vw, 132px)" }}>$1,188</div>
                <span style={{ color: "var(--band-muted)", fontSize: 16 }}>what a full year costs you</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 14, padding: "12px 0" }}>
                <div style={{ fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: "clamp(28px, 5vw, 34px)", letterSpacing: "-0.03em", minWidth: "clamp(104px, 20vw, 132px)", color: "var(--orange)" }}>1</div>
                <span style={{ color: "var(--band-muted)", fontSize: 16 }}>new patient who starts care, in most practices, covers it</span>
              </div>
            </div>
            <p style={{ color: "var(--band-muted)", fontSize: 15, marginTop: 18 }}>
              Run your own numbers. If one care plan in your office is worth more than $1,188, the decision isn't really about the price.
            </p>

            {/* CTA BUTTONS */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 30 }}>
              <a href={monthlyLink} style={{ fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 16, textDecoration: "none", padding: "14px 22px", borderRadius: 6, background: "var(--orange)", color: "#fff", border: "2px solid var(--orange)", display: "inline-block", textAlign: "center", flex: "1 1 auto", minWidth: 180 }}>
                Join for $99/month
              </a>
              <a href={fitCallLink} style={{ fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 16, textDecoration: "none", padding: "14px 22px", borderRadius: 6, background: "transparent", color: "var(--band-ink)", border: "2px solid rgba(255,255,255,.35)", display: "inline-block", textAlign: "center", flex: "1 1 auto", minWidth: 180 }}>
                Talk to me first
              </a>
            </div>
          </div>
        </header>

        {/* YOU'RE PROBABLY LISTED SOMEWHERE ALREADY */}
        <section style={{ padding: "52px 0", borderTop: "1px solid var(--line)" }}>
          <div style={{ maxWidth: 660, margin: "0 auto", padding: "0 22px" }}>
            <h2 style={{ fontFamily: "Archivo, sans-serif", fontSize: 27, lineHeight: 1.2, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 18px" }}>You're probably listed somewhere already</h2>
            <p style={{ margin: "0 0 16px" }}>And it's doing nothing for you. Most directories take your money, put your name in a database, and wait for someone to stumble onto it. You've been paying one of them for years and couldn't name a single patient who came from it.</p>
            <p style={{ margin: "0 0 16px" }}>This one works differently, and the members who are on both will tell you so. I'm posting their clips every week. I'm putting them in front of my audience. When someone asks me for a chiropractor in their city, I'm the one making the introduction. The listing is the smallest part of what you're paying for.</p>
            <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 10, padding: 24, marginTop: 22 }}>
              <h3 style={{ fontFamily: "Archivo, sans-serif", fontSize: 18, fontWeight: 700, margin: "0 0 10px" }}>A list versus a machine</h3>
              <ul style={{ margin: 0, paddingLeft: 20, color: "var(--muted)", fontSize: 16 }}>
                <li style={{ marginBottom: 8 }}>A list waits for search traffic. This sends traffic at you.</li>
                <li style={{ marginBottom: 8 }}>A list gives you a page. This gives you a year of scheduled content.</li>
                <li style={{ marginBottom: 8 }}>A list forgets you after checkout. I know every doctor on here by name.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* MEMBER QUOTES */}
        <MemberQuotes />

        {/* WHAT YOU GET */}
        <section style={{ padding: "52px 0", borderTop: "1px solid var(--line)" }}>
          <div style={{ maxWidth: 660, margin: "0 auto", padding: "0 22px" }}>
            <h2 style={{ fontFamily: "Archivo, sans-serif", fontSize: 27, lineHeight: 1.2, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 18px" }}>What you actually get</h2>
            {[
              { title: "A profile patients can find", desc: "Your listing in a directory built for one thing: helping people find a nervous system-focused chiropractor near them. Not a scraped list of every license in the state." },
              { title: "Two interviews with me", desc: "A recorded NeuroChiro Spotlight and a live interview on my Instagram, where I put you in front of my audience." },
              { title: "80 to 100 short-form clips", desc: "We cut both interviews into clips and schedule them across Instagram, TikTok, and YouTube for up to 12 months. You do two interviews. The content runs for a year." },
              { title: "Every clip, in your own folder", desc: "A shared Drive of all of it, yours to run as ads, post yourself, or hand to whoever manages your marketing. You keep them even if you leave." },
              { title: "The room", desc: "Dashboard, job board, seminars marketplace, and a community of doctors practicing the same way you do." },
            ].map((item, i) => (
              <div key={i} style={{ padding: "18px 0", borderTop: i > 0 ? "1px solid var(--line)" : "none" }}>
                <h3 style={{ fontFamily: "Archivo, sans-serif", fontSize: 18, fontWeight: 700, margin: "0 0 6px" }}>{item.title}</h3>
                <p style={{ color: "var(--muted)", margin: 0, fontSize: 16 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* WHAT I WON'T PROMISE */}
        <section style={{ padding: "52px 0", borderTop: "1px solid var(--line)" }}>
          <div style={{ maxWidth: 660, margin: "0 auto", padding: "0 22px" }}>
            <h2 style={{ fontFamily: "Archivo, sans-serif", fontSize: 27, lineHeight: 1.2, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 18px" }}>What I won't promise you</h2>
            <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 10, padding: 24 }}>
              <h3 style={{ fontFamily: "Archivo, sans-serif", fontSize: 18, fontWeight: 700, margin: "0 0 10px" }}>I can't guarantee you patients.</h3>
              <ul style={{ margin: 0, paddingLeft: 20, color: "var(--muted)", fontSize: 16 }}>
                <li style={{ marginBottom: 8 }}>Nobody honest can. What shows up depends on your market, your profile, and what you do when a lead comes in.</li>
                <li style={{ marginBottom: 8 }}>I don't take a cut of any patient you see, and I never will. You pay a flat membership, not a finder's fee.</li>
                <li style={{ marginBottom: 8 }}>What I can guarantee is the work: your profile goes up, your interviews get recorded, your clips get made and scheduled, and the files are yours.</li>
              </ul>
              <p style={{ marginTop: 14, fontSize: 16, color: "var(--muted)" }}>
                Price out 80 to 100 edited clips from a video team and you'll pass $1,188 before anyone touches the directory. That's the floor. The patients are the upside.
              </p>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section style={{ padding: "52px 0", borderTop: "1px solid var(--line)" }}>
          <div style={{ maxWidth: 660, margin: "0 auto", padding: "0 22px" }}>
            <h2 style={{ fontFamily: "Archivo, sans-serif", fontSize: 27, lineHeight: 1.2, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 18px" }}>How it works</h2>
            {[
              { title: "Sign and pay", desc: "The membership agreement takes five minutes. Monthly or annual, your call." },
              { title: "Book your onboarding call", desc: "Thirty minutes with me. We build your profile and schedule your two interviews." },
              { title: "Record, then let it run", desc: "We record the Spotlight and the Instagram Live. After that the clips post on schedule and you get back to adjusting people." },
            ].map((step, i) => (
              <div key={i} style={{ position: "relative", padding: "0 0 22px 46px" }}>
                <div style={{ position: "absolute", left: 0, top: -2, fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 15, color: "var(--orange)", width: 30, height: 30, border: "2px solid var(--orange)", borderRadius: "50%", display: "grid", placeItems: "center" }}>
                  {i + 1}
                </div>
                <h3 style={{ fontFamily: "Archivo, sans-serif", fontSize: 18, fontWeight: 700, margin: "0 0 6px" }}>{step.title}</h3>
                <p style={{ color: "var(--muted)", fontSize: 16, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section style={{ padding: "52px 0", borderTop: "1px solid var(--line)" }}>
          <div style={{ maxWidth: 660, margin: "0 auto", padding: "0 22px" }}>
            <h2 style={{ fontFamily: "Archivo, sans-serif", fontSize: 27, lineHeight: 1.2, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 18px" }}>Questions doctors ask me</h2>
            {faqs.map((faq, i) => (
              <div key={i} style={{ borderBottom: "1px solid var(--line)", padding: "16px 0", borderTop: i === 0 ? "1px solid var(--line)" : "none" }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 17, cursor: "pointer", display: "flex", justifyContent: "space-between", gap: 16, width: "100%", background: "none", border: "none", color: "var(--ink)", textAlign: "left", padding: 0 }}
                >
                  {faq.q}
                  <span style={{ color: "var(--orange)", fontWeight: 700, flexShrink: 0 }}>{openFaq === i ? "\u2013" : "+"}</span>
                </button>
                {openFaq === i && (
                  <p style={{ color: "var(--muted)", fontSize: 16, margin: "12px 0 0" }}>{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CLOSE / CTA */}
        <section style={{ background: "var(--band)", color: "var(--band-ink)", padding: "52px 0", borderTop: "1px solid var(--line)" }}>
          <div style={{ maxWidth: 660, margin: "0 auto", padding: "0 22px" }}>
            <h2 style={{ fontFamily: "Archivo, sans-serif", fontSize: 27, lineHeight: 1.2, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 18px", color: "var(--band-ink)" }}>Two ways to start</h2>
            <p style={{ color: "var(--band-muted)", margin: "0 0 16px" }}>
              If you know it's a fit, join and book your onboarding call today. If you want to ask me something first, take fifteen minutes on my calendar. No pitch, just a straight conversation about whether this is right for your practice.
            </p>
            <div style={{ fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 16, color: "var(--band-ink)", marginBottom: 6 }}>
              $99/month &nbsp;&middot;&nbsp; or $990/year, two months free
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 20 }}>
              <a href={monthlyLink} style={{ fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 16, textDecoration: "none", padding: "14px 22px", borderRadius: 6, background: "var(--orange)", color: "#fff", border: "2px solid var(--orange)", display: "inline-block", textAlign: "center", flex: "1 1 auto", minWidth: 140 }}>
                Join monthly
              </a>
              <a href={annualLink} style={{ fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 16, textDecoration: "none", padding: "14px 22px", borderRadius: 6, background: "var(--orange)", color: "#fff", border: "2px solid var(--orange)", display: "inline-block", textAlign: "center", flex: "1 1 auto", minWidth: 140 }}>
                Join annual
              </a>
              <a href={fitCallLink} style={{ fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 16, textDecoration: "none", padding: "14px 22px", borderRadius: 6, background: "transparent", color: "var(--band-ink)", border: "2px solid rgba(255,255,255,.35)", display: "inline-block", textAlign: "center", flex: "1 1 auto", minWidth: 140 }}>
                Book a Fit Call
              </a>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ padding: "30px 0 44px", textAlign: "center", color: "var(--muted)", fontSize: 14 }}>
          <div style={{ maxWidth: 660, margin: "0 auto", padding: "0 22px" }}>
            NeuroChiro Network &middot; <a href="https://neurochiro.co" style={{ color: "var(--muted)", textDecoration: "none" }}>neurochiro.co</a> &middot; support@neurochirodirectory.com
          </div>
        </footer>
      </div>
    </>
  );
}

/**
 * Member quotes component. Renders nothing when the list is empty.
 * Add quotes here as they come in.
 */
const MEMBER_QUOTES: { text: string; name: string; city: string }[] = [
  // { text: "Quote here.", name: "Dr. First Last", city: "City, ST" },
];

function MemberQuotes() {
  if (MEMBER_QUOTES.length === 0) return null;

  return (
    <section style={{ padding: "40px 0 52px", borderTop: "1px solid var(--line)" }}>
      <div style={{ maxWidth: 660, margin: "0 auto", padding: "0 22px" }}>
        <div style={{ display: "grid", gap: 20 }}>
          {MEMBER_QUOTES.map((q, i) => (
            <div key={i} style={{ borderLeft: "3px solid var(--orange)", paddingLeft: 20 }}>
              <p style={{ fontSize: 16, lineHeight: 1.6, margin: "0 0 8px", fontStyle: "italic" }}>
                &ldquo;{q.text}&rdquo;
              </p>
              <p style={{ fontFamily: "Archivo, sans-serif", fontSize: 14, fontWeight: 700, color: "var(--muted)", margin: 0 }}>
                {q.name} &middot; {q.city}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
