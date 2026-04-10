import { lookupReferralCode } from "@/app/actions/referral-program";
import Link from "next/link";
import { ArrowRight, Gift, ShieldCheck, Users } from "lucide-react";
import Footer from "@/components/landing/Footer";

export const metadata = {
  title: "Join NeuroChiro | Referral Invite",
  description: "You've been invited to join the global network of nervous system chiropractors.",
};

interface Props {
  searchParams: Promise<{ ref?: string }>;
}

export default async function JoinReferralPage({ searchParams }: Props) {
  const params = await searchParams;
  const code = params.ref || "";
  const referrer = code ? await lookupReferralCode(code) : null;

  return (
    <div className="min-h-dvh bg-neuro-cream">
      <section className="bg-neuro-navy text-white pt-40 pb-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-neuro-orange/20 flex items-center justify-center mx-auto mb-6">
            <Gift className="w-8 h-8 text-neuro-orange" />
          </div>

          {referrer ? (
            <>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neuro-orange mb-4">
                You&apos;ve Been Invited
              </p>
              <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight leading-tight mb-4 text-white">
                {referrer.name} <br />
                <span className="text-neuro-orange">Wants You to Join</span>
              </h1>
              <p className="text-gray-400 text-lg mb-2">
                {referrer.clinic && <span>{referrer.clinic} &middot; </span>}
                {referrer.location}
              </p>
              <p className="text-gray-400 mb-10">
                Join the NeuroChiro network and you&apos;ll both get a free month of membership.
              </p>
            </>
          ) : (
            <>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neuro-orange mb-4">
                Join the Network
              </p>
              <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight leading-tight mb-4 text-white">
                Join <span className="text-neuro-orange">NeuroChiro</span>
              </h1>
              <p className="text-gray-400 text-lg mb-10">
                The global directory for nervous system chiropractors.
              </p>
            </>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/register?role=doctor${code ? `&ref=${code}` : ''}`}
              className="px-8 py-4 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors inline-flex items-center justify-center gap-2"
            >
              Join as a Doctor <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href={`/register?role=student${code ? `&ref=${code}` : ''}`}
              className="px-8 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors border border-white/20"
            >
              Join as a Student
            </Link>
          </div>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-8 mt-12">
            {[
              { icon: Gift, label: referrer ? "1 Month Free for Both" : "Free Trial Available" },
              { icon: Users, label: "140+ Verified Doctors" },
              { icon: ShieldCheck, label: "100% Verified Network" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-gray-400">
                <item.icon className="w-4 h-4 text-neuro-orange" />
                <span className="text-sm font-bold">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
