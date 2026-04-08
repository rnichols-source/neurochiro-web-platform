import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

const features = [
  "Verified vendor listing in the NeuroChiro Marketplace",
  "Exposure to 140+ nervous-system-first clinics",
  "Official NeuroChiro Partner badge",
  "Direct reach to chiropractic doctors and students",
];

export default function MarketplacePricingPage() {
  return (
    <div className="min-h-dvh bg-neuro-cream pt-24 pb-20">
      <div className="max-w-lg mx-auto px-6 text-center">
        <h1 className="text-4xl font-heading font-black text-neuro-navy mb-2">Marketplace Partner</h1>
        <p className="text-gray-500 mb-10">One simple plan to reach the NeuroChiro community.</p>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-10 space-y-8">
          <div>
            <span className="text-5xl font-black text-neuro-navy">$99</span>
            <span className="text-gray-400 text-lg font-bold">/month</span>
          </div>

          <div className="space-y-4 text-left">
            {features.map((f) => (
              <div key={f} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-neuro-navy/80">{f}</span>
              </div>
            ))}
          </div>

          <Link
            href="/marketplace/apply"
            className="block w-full py-4 bg-neuro-orange text-white font-black uppercase tracking-widest rounded-xl text-center hover:bg-neuro-orange-dark transition-all shadow-lg shadow-neuro-orange/20 text-sm"
          >
            Apply Now
          </Link>
        </div>

        <Link href="/marketplace" className="inline-block mt-8 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-neuro-orange transition-colors">
          Back to Marketplace
        </Link>
      </div>
    </div>
  );
}
