import Link from "next/link";
import Footer from "@/components/landing/Footer";

export function StoreFallback() {
  return (
    <div className="bg-neuro-cream text-neuro-black">
      <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-6 pb-20 pt-32 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-neuro-orange">NeuroChiro merch</p>
        <h1 className="mt-4 font-heading text-4xl font-black text-neuro-navy">Spine to Win.</h1>
        <div className="mt-8 w-full rounded-2xl border border-black/5 bg-white px-6 py-10 shadow-sm">
          <p className="text-lg font-semibold leading-relaxed text-neuro-black">
            The NeuroChiro merch store is restocking. Check back soon.
          </p>
          <Link
            href="/directory"
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-neuro-orange px-6 text-base font-bold text-white hover:bg-[#B8551F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neuro-navy focus-visible:ring-offset-2"
          >
            Find a NeuroChiro chiropractor
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
