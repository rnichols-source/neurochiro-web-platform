import { Suspense } from "react";
import Link from "next/link";
import { getProPageStats, getDemandMapData } from "./actions";
import ProDemandSection from "./ProDemandSection";
import ProCTA from "./ProCTA";
import ProFAQ from "./ProFAQ";

export const revalidate = 300;

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@500;700;800&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap');
  .pro-page h1, .pro-page h2, .pro-page h3 { color: #F1EDE7 !important; }
  .pro-page p, .pro-page li, .pro-page span { color: inherit; }
`;

const faqs = [
  { q: "Is $99 a month worth it if I'm already busy?", a: "If your schedule is full and you never want another new patient, probably not. Most doctors joining aren't short on patients in general, they're short on the right ones: people who understand nervous system care before they walk in. That's who searches this directory." },
  { q: "How many patients will I get?", a: "I don't know, and anyone who gives you a number is guessing. It depends on how many people search your area and how fast you respond when one reaches out. What I'd judge it on: a year of content in your own folder, plus a listing in front of patients specifically looking for how you practice." },
  { q: "How much of my time does this take?", a: "One 30-minute onboarding call and two interviews. That's it. The editing, scheduling, and posting are on us." },
  { q: "What if I want out?", a: "Cancel anytime by email. You stay active through the period you already paid for, and the clips already in your folder stay yours." },
  { q: "Nobody's searching my city yet. Why join now?", a: "Then you're the first name in it when they do. We're building a patient list by ZIP code, and when someone in your area is waiting, they hear about you. Early listings also get the most content while the roster is small." },
  { q: "Who can join?", a: "Licensed chiropractors in good standing who practice with a nervous system focus. I review every application myself before anyone goes live. If you're not a fit, I'll tell you." },
  { q: "Do you have territories? What stops another doctor a mile from me from joining?", a: "No territories. Any chiropractor who practices with a nervous system focus and passes review can list, wherever they are. What protects you isn't exclusivity, it's proximity. Patients see distance on every result and the directory sorts nearest first. If you're the closest one to them, you're the first name they see." },
  { q: "How do I know this demand is real?", a: "Every number on this page is a live count. The demand signals come from two places: people who commented on my Instagram posts asking for a nervous system chiropractor in their city, and people who joined the patient waitlist with their ZIP code. Not traffic estimates, not impressions, not projections. The map updates as new requests come in. Where the count in a specific area is below three, I suppress the exact number to protect privacy." },
];

export default async function ProPage() {
  const [stats, mapData] = await Promise.all([
    getProPageStats(),
    getDemandMapData(),
  ]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="pro-page" style={{ background: "#131E27", color: "#F1EDE7", fontFamily: '"Source Serif 4", Georgia, "Times New Roman", serif', fontSize: 17, lineHeight: 1.65, margin: 0 }}>

        {/* ═══ 1. HERO ═══ */}
        <header style={{ background: "#0D161D", color: "#F1EDE7", padding: "58px 0 52px" }}>
          <div style={{ maxWidth: 660, margin: "0 auto", padding: "0 22px" }}>
            <div style={{ fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 15, letterSpacing: "0.04em", marginBottom: 42 }}>
              <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
                NEURO<b style={{ color: "#D66829", fontWeight: 800 }}>CHIRO</b>
              </Link>
            </div>
            <h1 style={{ fontFamily: "Archivo, sans-serif", fontSize: "clamp(31px, 6vw, 38px)", lineHeight: 1.08, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 18px" }}>
              Patients are already searching for a chiropractor who practices the way you do.
            </h1>
            <p style={{ color: "#93A0AC", fontSize: 18, maxWidth: "30em", margin: "0 0 16px" }}>
              NeuroChiro is the directory that puts you in front of them, and a content engine that keeps you in front of them all year.
            </p>

            {/* MATH BLOCK */}
            <div style={{ margin: "40px 0 8px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 14, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,.12)" }}>
                <div style={{ fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: "clamp(28px, 5vw, 34px)", letterSpacing: "-0.03em", minWidth: "clamp(104px, 20vw, 132px)" }}>$99</div>
                <span style={{ color: "#93A0AC", fontSize: 16 }}>per month, cancel anytime</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 14, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,.12)" }}>
                <div style={{ fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: "clamp(28px, 5vw, 34px)", letterSpacing: "-0.03em", minWidth: "clamp(104px, 20vw, 132px)" }}>$1,188</div>
                <span style={{ color: "#93A0AC", fontSize: 16 }}>what a full year costs you</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 14, padding: "12px 0" }}>
                <div style={{ fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: "clamp(28px, 5vw, 34px)", letterSpacing: "-0.03em", minWidth: "clamp(104px, 20vw, 132px)", color: "#D66829" }}>1</div>
                <span style={{ color: "#93A0AC", fontSize: 16 }}>new patient who starts care, in most practices, covers it</span>
              </div>
            </div>
            <p style={{ color: "#93A0AC", fontSize: 15, marginTop: 18 }}>
              Run your own numbers. If one care plan in your office is worth more than $1,188, the decision isn't really about the price.
            </p>

            <Suspense fallback={<div style={{ height: 56, marginTop: 30 }} />}>
              <ProCTA variant="hero" />
            </Suspense>
          </div>
        </header>

        {/* ═══ 2. THE DEMAND NUMBER ═══ */}
        <section style={{ padding: "52px 0", borderTop: "1px solid #2A3B49" }}>
          <div style={{ maxWidth: 660, margin: "0 auto", padding: "0 22px" }}>
            <p style={{ fontFamily: "Archivo, sans-serif", fontSize: 13, letterSpacing: "0.06em", color: "#D66829", textTransform: "uppercase", fontWeight: 700, margin: "0 0 12px" }}>
              Real demand
            </p>
            <h2 style={{ fontFamily: "Archivo, sans-serif", fontSize: "clamp(27px, 5vw, 34px)", lineHeight: 1.15, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 16px" }}>
              {stats.totalDemandSignals.toLocaleString()} people have asked for a nervous system chiropractor in their area.
            </h2>
            <p style={{ color: "#93A0AC", fontSize: 16, margin: "0 0 6px" }}>
              {stats.totalMentions.toLocaleString()} commented on a post asking for a doctor in their city.
              {" "}{stats.confirmedSubscribers > 0 && `${stats.confirmedSubscribers.toLocaleString()} joined the patient waitlist.`}
            </p>
            <p style={{ color: "#93A0AC", fontSize: 16, margin: 0 }}>
              {stats.mentionsByCountry.length > 1 ? (
                <>Across {stats.countriesWithDemand} countries: {stats.mentionsByCountry.map(c => {
                  const labels: Record<string, string> = { US: 'US', CA: 'Canada', GB: 'UK', AU: 'Australia', SG: 'Singapore' }
                  return `${c.count} ${labels[c.country] || c.country}`
                }).join(', ')}.</>
              ) : (
                <>They're in {stats.statesCovered} states. Most haven't found their doctor yet.</>
              )}
            </p>
          </div>
        </section>

        {/* ═══ 3. MAP + 4. DEMAND LOOKUP (shared country state) ═══ */}
        <ProDemandSection allDoctors={mapData.doctors} allDemandCities={mapData.demandCities} />

        {/* ═══ 5. HOW A PATIENT REACHES YOU ═══ */}
        <section style={{ padding: "52px 0", borderTop: "1px solid #2A3B49" }}>
          <div style={{ maxWidth: 660, margin: "0 auto", padding: "0 22px" }}>
            <p style={{ fontFamily: "Archivo, sans-serif", fontSize: 13, letterSpacing: "0.06em", color: "#D66829", textTransform: "uppercase", fontWeight: 700, margin: "0 0 12px" }}>
              The system
            </p>
            <h2 style={{ fontFamily: "Archivo, sans-serif", fontSize: 27, lineHeight: 1.2, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 28px" }}>How a patient reaches you</h2>
            {[
              { title: "I create demand.", desc: "Content to 185K followers teaching people what nervous system care actually is. Most patients don't know this kind of chiropractic exists." },
              { title: "They raise their hand.", desc: "People comment their city asking where to find someone. Others join the patient waitlist with their ZIP code." },
              { title: "The system routes them.", desc: "If a member is nearby, they see that doctor's profile with distance, hours, cost, and how to book. If nobody's nearby, they go on the waitlist for that area." },
              { title: "The patient asks for contact.", desc: "When a member joins an uncovered area, everyone waiting there gets an email. They tap a button to ask that office to reach out, and give their phone number. The patient initiates it. No cold calls, no purchased lists, explicit consent recorded with the doctor's name on it." },
              { title: "The doctor follows up.", desc: "The request lands in the member's dashboard and inbox with the patient's name, number, and what they asked for." },
            ].map((step, i) => (
              <div key={i} style={{ position: "relative", padding: "0 0 24px 46px" }}>
                <div style={{ position: "absolute", left: 0, top: -2, fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 15, color: "#D66829", width: 30, height: 30, border: "2px solid #D66829", borderRadius: "50%", display: "grid", placeItems: "center" }}>
                  {i + 1}
                </div>
                <h3 style={{ fontFamily: "Archivo, sans-serif", fontSize: 18, fontWeight: 700, margin: "0 0 6px", color: "#F1EDE7" }}>{step.title}</h3>
                <p style={{ color: "#A5B0BB", fontSize: 16, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
            <p style={{ color: "#A5B0BB", fontSize: 16, marginTop: 8, borderTop: "1px solid #2A3B49", paddingTop: 20 }}>
              No referral fees, no per-patient charges, no commission. A flat membership, and a system built so the patient is always the one who reaches out first.
            </p>
          </div>
        </section>

        {/* ═══ 6. YOU'RE PROBABLY LISTED SOMEWHERE ALREADY ═══ */}
        <section style={{ padding: "52px 0", borderTop: "1px solid #2A3B49" }}>
          <div style={{ maxWidth: 660, margin: "0 auto", padding: "0 22px" }}>
            <h2 style={{ fontFamily: "Archivo, sans-serif", fontSize: 27, lineHeight: 1.2, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 18px" }}>You're probably listed somewhere already</h2>
            <p style={{ margin: "0 0 16px" }}>And it's doing nothing for you. Most directories take your money, put your name in a database, and wait for someone to stumble onto it. You've been paying one of them for years and couldn't name a single patient who came from it.</p>
            <p style={{ margin: "0 0 16px" }}>This one works differently, and the members who are on both will tell you so. I'm posting their clips every week. I'm putting them in front of my audience. When someone asks me for a chiropractor in their city, I'm the one making the introduction. The listing is the smallest part of what you're paying for.</p>
            <div style={{ background: "#1A2833", border: "1px solid #2A3B49", borderRadius: 10, padding: 24, marginTop: 22 }}>
              <h3 style={{ fontFamily: "Archivo, sans-serif", fontSize: 18, fontWeight: 700, margin: "0 0 10px" }}>A list versus a machine</h3>
              <ul style={{ margin: 0, paddingLeft: 20, color: "#A5B0BB", fontSize: 16 }}>
                <li style={{ marginBottom: 8 }}>A list waits for search traffic. This sends traffic at you.</li>
                <li style={{ marginBottom: 8 }}>A list gives you a page. This gives you a year of scheduled content.</li>
                <li style={{ marginBottom: 8 }}>A list forgets you after checkout. I know every doctor on here by name.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ═══ 7. WHAT YOU GET ═══ */}
        <section style={{ padding: "52px 0", borderTop: "1px solid #2A3B49" }}>
          <div style={{ maxWidth: 660, margin: "0 auto", padding: "0 22px" }}>
            <h2 style={{ fontFamily: "Archivo, sans-serif", fontSize: 27, lineHeight: 1.2, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 18px" }}>What you actually get</h2>
            {[
              { title: "A profile patients can find", desc: "Your listing in a directory built for one thing: helping people find a nervous system-focused chiropractor near them. Not a scraped list of every license in the state." },
              { title: "Two interviews with me", desc: "A recorded NeuroChiro Spotlight and a live interview on my Instagram, where I put you in front of my audience." },
              { title: "80 to 100 short-form clips", desc: "We cut both interviews into clips and schedule them across Instagram, TikTok, and YouTube for up to 12 months. You do two interviews. The content runs for a year." },
              { title: "Every clip, in your own folder", desc: "A shared Drive of all of it, yours to run as ads, post yourself, or hand to whoever manages your marketing. You keep them even if you leave." },
              { title: "The room", desc: "Dashboard, job board, seminars marketplace, and a community of doctors practicing the same way you do." },
            ].map((item, i) => (
              <div key={i} style={{ padding: "18px 0", borderTop: i > 0 ? "1px solid #2A3B49" : "none" }}>
                <h3 style={{ fontFamily: "Archivo, sans-serif", fontSize: 18, fontWeight: 700, margin: "0 0 6px" }}>{item.title}</h3>
                <p style={{ color: "#A5B0BB", margin: 0, fontSize: 16 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ 8. WHAT I WON'T PROMISE ═══ */}
        <section style={{ padding: "52px 0", borderTop: "1px solid #2A3B49" }}>
          <div style={{ maxWidth: 660, margin: "0 auto", padding: "0 22px" }}>
            <h2 style={{ fontFamily: "Archivo, sans-serif", fontSize: 27, lineHeight: 1.2, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 18px" }}>What I won't promise you</h2>
            <div style={{ background: "#1A2833", border: "1px solid #2A3B49", borderRadius: 10, padding: 24 }}>
              <h3 style={{ fontFamily: "Archivo, sans-serif", fontSize: 18, fontWeight: 700, margin: "0 0 10px" }}>I can't guarantee you patients.</h3>
              <ul style={{ margin: 0, paddingLeft: 20, color: "#A5B0BB", fontSize: 16 }}>
                <li style={{ marginBottom: 8 }}>Nobody honest can. What shows up depends on your market, your profile, and what you do when a lead comes in.</li>
                <li style={{ marginBottom: 8 }}>I don't take a cut of any patient you see, and I never will. You pay a flat membership, not a finder's fee.</li>
                <li style={{ marginBottom: 8 }}>What I can guarantee is the work: your profile goes up, your interviews get recorded, your clips get made and scheduled, and the files are yours.</li>
              </ul>
              <p style={{ marginTop: 14, fontSize: 16, color: "#A5B0BB" }}>
                Price out 80 to 100 edited clips from a video team and you'll pass $1,188 before anyone touches the directory. That's the floor. The patients are the upside.
              </p>
            </div>
          </div>
        </section>

        {/* ═══ 9. HOW IT WORKS ═══ */}
        <section style={{ padding: "52px 0", borderTop: "1px solid #2A3B49" }}>
          <div style={{ maxWidth: 660, margin: "0 auto", padding: "0 22px" }}>
            <h2 style={{ fontFamily: "Archivo, sans-serif", fontSize: 27, lineHeight: 1.2, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 18px" }}>How it works</h2>
            {[
              { title: "Sign and pay", desc: "The membership agreement takes five minutes. Monthly or annual, your call." },
              { title: "Book your onboarding call", desc: "Thirty minutes with me. We build your profile and schedule your two interviews." },
              { title: "Record, then let it run", desc: "We record the Spotlight and the Instagram Live. After that the clips post on schedule and you get back to adjusting people." },
            ].map((step, i) => (
              <div key={i} style={{ position: "relative", padding: "0 0 22px 46px" }}>
                <div style={{ position: "absolute", left: 0, top: -2, fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 15, color: "#D66829", width: 30, height: 30, border: "2px solid #D66829", borderRadius: "50%", display: "grid", placeItems: "center" }}>
                  {i + 1}
                </div>
                <h3 style={{ fontFamily: "Archivo, sans-serif", fontSize: 18, fontWeight: 700, margin: "0 0 6px" }}>{step.title}</h3>
                <p style={{ color: "#A5B0BB", fontSize: 16, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ 10. FAQ ═══ */}
        <ProFAQ faqs={faqs} />

        {/* ═══ 11. CLOSE / CTA ═══ */}
        <section style={{ background: "#0D161D", color: "#F1EDE7", padding: "52px 0", borderTop: "1px solid #2A3B49" }}>
          <div style={{ maxWidth: 660, margin: "0 auto", padding: "0 22px" }}>
            <h2 style={{ fontFamily: "Archivo, sans-serif", fontSize: 27, lineHeight: 1.2, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 18px", color: "#F1EDE7" }}>Two ways to start</h2>
            <p style={{ color: "#93A0AC", margin: "0 0 16px" }}>
              If you know it's a fit, join and book your onboarding call today. If you want to ask me something first, take fifteen minutes on my calendar. No pitch, just a straight conversation about whether this is right for your practice.
            </p>
            <Suspense fallback={<div style={{ height: 56 }} />}>
              <ProCTA variant="close" />
            </Suspense>
          </div>
        </section>

        {/* ═══ 12. FOOTER ═══ */}
        <footer style={{ padding: "30px 0 44px", textAlign: "center", color: "#A5B0BB", fontSize: 14 }}>
          <div style={{ maxWidth: 660, margin: "0 auto", padding: "0 22px" }}>
            NeuroChiro Network &middot; <a href="https://neurochiro.co" style={{ color: "#A5B0BB", textDecoration: "none" }}>neurochiro.co</a> &middot; support@neurochirodirectory.com
          </div>
        </footer>
      </div>
    </>
  );
}
