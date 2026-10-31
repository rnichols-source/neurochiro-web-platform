import Link from 'next/link';
import PageHeader from '@/components/portal/PageHeader';
import { getPortalContext } from '@/lib/portal/context';
import { redirect } from 'next/navigation';

const TOOLS = [
  { href: '/doctor/care-plan', title: 'Care plan', detail: 'A visit-by-visit plan you can edit for your office.' },
  { href: '/doctor/scan-report', title: 'Scan reports', detail: 'Turn scan numbers into a report patients can read.' },
  { href: '/doctor/kpi', title: 'KPI tracker', detail: 'Log your weekly numbers and see the trend.' },
  { href: '/doctor/pl-analyzer', title: 'P&L analyzer', detail: 'See where the practice makes and spends money.' },
  { href: '/doctor/ce-tracker', title: 'CE tracker', detail: 'Certificates from seminars you attended.' },
  { href: '/doctor/billing-guide', title: 'Billing guide', detail: 'Coding notes included with practice tools.' },
];

export default async function ToolsPage() {
  const ctx = await getPortalContext();
  if (!ctx) redirect('/login');
  return (
    <div className="space-y-6">
      <PageHeader title="Practice tools" description="Care plan, scan reports, KPIs, P&L, CE, and the billing guide." />
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
