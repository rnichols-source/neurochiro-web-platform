import { CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import Footer from "@/components/landing/Footer";

export const metadata = {
  title: "You're In! | NeuroChiro",
  description: "Your email is confirmed. Welcome to the NeuroChiro patient list.",
};

export default function ConfirmedPage() {
  return (
    <div className="min-h-dvh bg-neuro-cream">
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-heading font-black text-neuro-navy mb-3">
            You're In!
          </h1>
          <p className="text-gray-500 leading-relaxed mb-8">
            Your email is confirmed. You'll receive weekly nervous system health education, and we'll notify you the moment a NeuroChiro doctor joins near your area.
          </p>
          <Link
            href="/directory"
            className="inline-flex items-center gap-2 px-8 py-4 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors"
          >
            Browse the Directory <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}
