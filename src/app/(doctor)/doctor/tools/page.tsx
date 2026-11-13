import Link from 'next/link';
import PageHeader from '@/components/portal/PageHeader';
import { getPortalContext } from '@/lib/portal/context';
import { redirect } from 'next/navigation';

const TOOLS = [
  { href: '/doctor/care-plan', title: 'Care plan', detail: 'A visit-by-visit plan you can edit for your office.' },
  { href: '/doctor/scan-report', title: 'Scan reports', detail: 'Turn scan numbers into a report a community member can read.' },
  { href: '/doctor/kpi', title: 'KPI tracker', detail: 'Log today’s numbers, set goals, and choose what you track.' },
  { href: '/doctor/pl-analyzer', title: 'P&L analyzer', detail: 'See where the practice makes and spends money.' },
  { href: '/doctor/ce-tracker', title: 'CE tracker', detail: 'Certificates from seminars you attended.' },
  { href: '/doctor/billing-guide', title: 'Billing guide', detail: 'Coding notes included with practice tools.' },
];

const ALWAYS = [
  { href: '/doctor/care-plan-closer', title: 'Care Plan Closer', detail: 'Done-for-you care plan setup from Dr. Ray.' },
  { href: '/doctor/content-library', title: 'Content library', detail: 'Posts and handouts for your office.' },
  { href: '/doctor/workshops', title: 'Workshops', detail: 'Workshop kits.' },
  { href: '/doctor/screenings', title: 'Screenings', detail: 'Screening kits.' },
  { href: '/doctor/contracts', title: 'Contracts', detail: 'Agreement templates.' },
  { href: '/doctor/report', title: 'This month', detail: 'Views, requests, and the earlier day view.' },
  { href: '/doctor/purchases', title: 'My purchases', detail: 'Kits you have bought.' },
  { href: '/doctor/badges', title: 'Achievements', detail: 'Badges on your account.' },
];

export default async function ToolsPage() {
  const ctx = await getPortalContext();
  if (!ctx) redirect('/login');
  return (
    <div className="space-y-6">
      <PageHeader title="Practice tools" description="Care plan, scan reports, KPIs, P&L, CE, Care Plan Closer, and the billing guide." />
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ALWAYS.map((tool) => (
          <li key={tool.href} className="bg-white border border-portal-border rounded-xl p-4">
            <h2 className="font-bold">{tool.title}</h2>
            <p className="text-sm text-portal-ink-2 mt-1">{tool.detail}</p>
            <Link href={tool.href} className="mt-3 min-h-11 inline-flex items-center text-sm font-bold text-portal-accent">Open</Link>
          </li>
        ))}
      </ul>
      {ctx.membership.hasPracticeTools ? (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {TOOLS.map((tool) => (
            <li key={tool.href} className="bg-white border border-portal-border rounded-xl p-4">
              <h2 className="font-bold">{tool.title}</h2>
              <p className="text-sm text-portal-ink-2 mt-1">{tool.detail}</p>
              <Link href={tool.href} className="mt-3 min-h-11 inline-flex items-center text-sm font-bold text-portal-accent">Open</Link>
            </li>
          ))}
        </ul>
      ) : (
        <section className="bg-white border border-portal-border rounded-xl p-6">
          <h2 className="text-lg font-bold">Practice tools are not on this account</h2>
          <p className="mt-2 text-sm text-portal-ink-2">Founding members and Pro accounts created before July 15, 2026 include these tools. The links stay off so nothing here dead-ends.</p>
        </section>
      )}
    </div>
  );
}
