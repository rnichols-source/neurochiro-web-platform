import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-neuro-cream flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-neuro-navy rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto mb-6">N</div>
        <h1 className="text-4xl font-heading font-black text-neuro-navy mb-2">Page not found</h1>
        <p className="text-[#3d4a57] mb-8">That link is old or mistyped. Pick where you meant to go.</p>
        <div className="flex flex-col gap-3">
          <Link href="/doctor" className="px-6 py-3 bg-[#1E2D3B] text-white font-bold rounded-xl text-center">Doctor Today</Link>
          <Link href="/portal" className="px-6 py-3 bg-white text-neuro-navy font-bold rounded-xl border border-gray-200 text-center">Your NeuroChiro</Link>
          <Link href="/directory" className="px-6 py-3 bg-white text-neuro-navy font-bold rounded-xl border border-gray-200 text-center">Find a doctor</Link>
        </div>
      </div>
    </div>
  );
}
