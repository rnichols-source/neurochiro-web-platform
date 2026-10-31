import Link from 'next/link';
import PageHeader from '@/components/portal/PageHeader';

const KITS = [
  { href: '/doctor/contracts', title: 'Contracts', detail: 'Agreement templates you have bought.' },
  { href: '/doctor/workshops', title: 'Workshops', detail: 'Workshop kits tied to your purchase.' },
  { href: '/doctor/screenings', title: 'Screenings', detail: 'Screening kits tied to your purchase.' },
  { href: '/doctor/content-library', title: 'Content library', detail: 'Content you have unlocked.' },
];

export default function PurchasesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="My purchases" description="Kits you have bought. Each one opens only if it is on your account." />
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {KITS.map((kit) => (
          <li key={kit.href} className="bg-white border border-portal-border rounded-xl p-4">
            <h2 className="font-bold">{kit.title}</h2>
            <p className="text-sm text-portal-ink-2 mt-1">{kit.detail}</p>
            <Link href={kit.href} className="mt-3 min-h-11 inline-flex items-center text-sm font-bold text-portal-accent">Open</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
