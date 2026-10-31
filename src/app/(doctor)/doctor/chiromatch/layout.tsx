import Link from 'next/link';

export default function Layout({ children }: { children: React.ReactNode }) {
  void children;
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-[26px] font-bold leading-8 text-portal-ink">ChiroMatch</h1>
      <p className="mt-2 text-base text-portal-ink">The ranking rounds are closed. Matching is always on. You and a student both say yes before a conversation starts.</p>
      <Link href="/doctor/match" className="mt-4 inline-flex min-h-11 items-center text-base font-bold text-portal-accent">Open ChiroMatch</Link>
    </div>
  );
}
