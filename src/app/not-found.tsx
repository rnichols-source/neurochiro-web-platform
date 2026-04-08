import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-neuro-cream flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-neuro-navy rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto mb-6">N</div>
        <h1 className="text-4xl font-heading font-black text-neuro-navy mb-2">404</h1>
        <p className="text-gray-500 mb-8">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="px-6 py-3 bg-neuro-orange text-white font-bold rounded-xl text-center">Go Home</Link>
          <Link href="/directory" className="px-6 py-3 bg-white text-neuro-navy font-bold rounded-xl border border-gray-200 text-center">Find a Doctor</Link>
        </div>
      </div>
    </div>
  );
}
