import { Stethoscope, GraduationCap, MessageSquare, ShieldCheck, HelpCircle, Smartphone, Monitor, ArrowRight } from "lucide-react";

export const metadata = {
  title: "NeuroChiro Booth Guide — Australia",
  description: "Talking points and demo flow for the NeuroChiro booth rep.",
};

export default function BoothGuidePage() {
  return (
    <div className="min-h-dvh bg-[#0F1A24] text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a2e40] to-[#0F1A24] pt-16 pb-10 px-6 text-center border-b border-white/[0.06]">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D66829] mb-3">Internal — Booth Rep Only</p>
        <h1 className="text-3xl md:text-4xl font-black text-white mb-2">NeuroChiro Booth Guide</h1>
        <p className="text-white/40 text-sm">Everything you need to talk about NeuroChiro and get signups. Pull this up on your phone.</p>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-10">

        {/* The One-Liner */}
        <section>
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D66829] mb-3">The One-Liner</h2>
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
            <p className="text-xl font-black text-white leading-relaxed">
              &ldquo;NeuroChiro is the global directory and platform for nervous system chiropractors.
              Doctors get found by patients. Students get matched to jobs. It&apos;s free to join.&rdquo;
            </p>
          </div>
        </section>

        {/* When a DOCTOR walks up */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Stethoscope className="w-5 h-5 text-[#D66829]" />
            <h2 className="text-lg font-black text-white">When a Doctor Walks Up</h2>
          </div>
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D66829] mb-2">Open With</p>
              <p className="text-white/80">&ldquo;Do you focus on the nervous system in your practice?&rdquo;</p>
              <p className="text-white/40 text-xs mt-1">If yes → they&apos;re your person. If no → still invite them, the platform is for anyone who wants to learn.</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D66829] mb-2">Three Talking Points</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-[#D66829] font-black text-sm mt-0.5">1.</span>
                  <div>
                    <p className="text-white font-bold text-sm">Get found by patients</p>
                    <p className="text-white/40 text-xs">&ldquo;Patients search by city and find chiropractors who match their approach. Your profile shows up in the directory — it&apos;s like a nervous-system-specific Google listing.&rdquo;</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#D66829] font-black text-sm mt-0.5">2.</span>
                  <div>
                    <p className="text-white font-bold text-sm">Hire the right associate</p>
                    <p className="text-white/40 text-xs">&ldquo;ChiroMatch scores candidates on philosophy fit, not just resume. Post a job and get matched with students and doctors who think like you.&rdquo;</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#D66829] font-black text-sm mt-0.5">3.</span>
                  <div>
                    <p className="text-white font-bold text-sm">It&apos;s free</p>
                    <p className="text-white/40 text-xs">&ldquo;Listing is completely free. If you want analytics, messaging, and premium tools, there are paid tiers — but you don&apos;t need to pay anything to get started.&rdquo;</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D66829] mb-2">The Close</p>
              <p className="text-white/80">&ldquo;Scan this QR code — takes 15 seconds to sign up. Name, email, password. That&apos;s it.&rdquo;</p>
            </div>
          </div>
        </section>

        {/* When a STUDENT walks up */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-5 h-5 text-[#D66829]" />
            <h2 className="text-lg font-black text-white">When a Student Walks Up</h2>
          </div>
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D66829] mb-2">Open With</p>
              <p className="text-white/80">&ldquo;Are you in chiro school? What year?&rdquo;</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D66829] mb-2">Three Talking Points</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-[#D66829] font-black text-sm mt-0.5">1.</span>
                  <div>
                    <p className="text-white font-bold text-sm">Career tools built for you</p>
                    <p className="text-white/40 text-xs">&ldquo;There&apos;s a Career Readiness Score that tells you exactly where you stand. Plus courses, interview prep, contract review, and a financial planner.&rdquo;</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#D66829] font-black text-sm mt-0.5">2.</span>
                  <div>
                    <p className="text-white font-bold text-sm">Get matched to jobs</p>
                    <p className="text-white/40 text-xs">&ldquo;ChiroMatch connects you with doctors who are hiring — scored on philosophy fit, location, and what you&apos;re looking for. Not just a job board, it&apos;s a match.&rdquo;</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#D66829] font-black text-sm mt-0.5">3.</span>
                  <div>
                    <p className="text-white font-bold text-sm">Free to join</p>
                    <p className="text-white/40 text-xs">&ldquo;It&apos;s free to get started. You can upgrade later if you want the full academy and premium tools.&rdquo;</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D66829] mb-2">The Close</p>
              <p className="text-white/80">&ldquo;Scan the QR — 15 seconds, three fields, you&apos;re in. All the career tools open up right away.&rdquo;</p>
            </div>
          </div>
        </section>

        {/* How to Demo */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Monitor className="w-5 h-5 text-[#D66829]" />
            <h2 className="text-lg font-black text-white">How to Demo (30 seconds)</h2>
          </div>
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-[#D66829] font-black text-sm mt-0.5">1.</span>
                <div>
                  <p className="text-white font-bold text-sm">Open neurochiro.co/directory</p>
                  <p className="text-white/40 text-xs">Show them the directory. Search a city. Show a doctor profile. &ldquo;This is what your listing looks like.&rdquo;</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#D66829] font-black text-sm mt-0.5">2.</span>
                <div>
                  <p className="text-white font-bold text-sm">Show a profile</p>
                  <p className="text-white/40 text-xs">Click any doctor. Show the bio, specialties, reviews, contact. &ldquo;Patients see this when they search for a chiropractor near them.&rdquo;</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#D66829] font-black text-sm mt-0.5">3.</span>
                <div>
                  <p className="text-white font-bold text-sm">For students: show /careers</p>
                  <p className="text-white/40 text-xs">Show the job board. &ldquo;Every job here is from a nervous system chiropractor. ChiroMatch scores how well you fit.&rdquo;</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Common Questions */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="w-5 h-5 text-[#D66829]" />
            <h2 className="text-lg font-black text-white">Common Questions</h2>
          </div>
          <div className="space-y-3">
            {[
              { q: "Is it free?", a: "Yes. Listing is free for doctors. Students can join for free too. There are paid tiers if you want premium tools, but you don't need to pay anything to get started." },
              { q: "What's the catch?", a: "No catch. The founder is a practicing chiropractor. He built it because this side of the profession didn't have its own platform." },
              { q: "Does it work in Australia?", a: "We're expanding into Australia right now. If you sign up today, you'll be one of the first in your city. That means you show up first when patients search." },
              { q: "Who built this?", a: "Dr. Raymond Nichols — he's a nervous system chiropractor in Greenville, South Carolina. He still adjusts patients every week. He couldn't be here today but he recorded a message for you." },
              { q: "How is this different from Google?", a: "Google doesn't filter for philosophy. NeuroChiro only lists nervous system chiropractors. When a patient finds you here, they're already looking for what you do." },
              { q: "Can I try it before I commit?", a: "You're not committing to anything. Sign up for free, build your profile, see how it works. Upgrade whenever you want, or don't." },
              { q: "I'm not sure I'm 'nervous system' enough.", a: "If you lead with the nervous system in any capacity — subluxation-based, tonal, functional neuro, paediatric — you belong here." },
            ].map((item, i) => (
              <div key={i} className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
                <p className="text-sm font-bold text-white mb-1">&ldquo;{item.q}&rdquo;</p>
                <p className="text-xs text-white/50">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Booth Setup */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="w-5 h-5 text-[#D66829]" />
            <h2 className="text-lg font-black text-white">Booth Setup Checklist</h2>
          </div>
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
            <div className="space-y-3">
              {[
                "Banners up with QR codes clearly visible",
                "Tablet or laptop open to neurochiro.co/directory for live demos",
                "Second device playing Dr. Ray's 60-second video on loop",
                "QR code stickers / cards to hand out",
                "This page pulled up on your phone for reference",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-[#D66829] mt-0.5 shrink-0" />
                  <span className="text-sm text-white/70">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Key URLs */}
        <section>
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D66829] mb-3">Key URLs</h2>
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 space-y-3 font-mono text-sm">
            <div className="flex items-center justify-between">
              <span className="text-white/40">QR Landing Page</span>
              <span className="text-white">neurochiro.co/au</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/40">Directory</span>
              <span className="text-white">neurochiro.co/directory</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/40">Job Board</span>
              <span className="text-white">neurochiro.co/careers</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/40">This Guide</span>
              <span className="text-white">neurochiro.co/au/booth</span>
            </div>
          </div>
        </section>

        {/* Emergency Contact */}
        <section className="pb-10">
          <div className="bg-[#D66829]/10 border border-[#D66829]/20 rounded-2xl p-6 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D66829] mb-2">Need Help?</p>
            <p className="text-white/60 text-sm">Text or WhatsApp Dr. Ray directly if anything comes up.</p>
            <p className="text-white font-bold text-lg mt-2">+1 (864) 555-0199</p>
          </div>
        </section>

      </div>
    </div>
  );
}
