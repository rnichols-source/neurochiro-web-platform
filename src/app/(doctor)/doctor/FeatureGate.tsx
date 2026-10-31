import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getFeature, effectiveState, requirementMet } from '@/lib/portal/features';
import { getPortalContext, toNavContext } from '@/lib/portal/context';

export default async function FeatureGate({ feature, children }: { feature: string; children: React.ReactNode }) {
  const spec = getFeature(feature);
  const ctx = await getPortalContext();
  if (!spec || !ctx) return children;
  const navCtx = toNavContext(ctx);
  const state = effectiveState(spec, navCtx);
  if (state === 'hidden') redirect('/doctor/dashboard');
  if (state === 'coming_soon') redirect(`/doctor/coming-soon#${spec.key}`);
  if (!requirementMet(spec, navCtx)) {
    return (
      <div className="bg-white border border-portal-border rounded-xl p-6 max-w-lg">
        <h1 className="text-[26px] leading-8 font-bold text-portal-ink">{spec.label}</h1>
        <p className="mt-2 text-[15px] leading-6 text-portal-ink-2">This is part of Pro. Activate Pro to open {spec.label.toLowerCase()}.</p>
        <Link href="/doctor/billing" className="mt-4 min-h-11 inline-flex items-center px-4 rounded-lg bg-portal-accent text-white text-sm font-bold">Upgrade</Link>
      </div>
    );
  }
  return (
    <div>
      {state === 'beta' ? (
        <Link href={`/doctor/help?topic=${spec.key}`} className="inline-flex items-center min-h-11 px-3 mb-4 rounded-lg bg-portal-warning-bg text-portal-warning text-sm font-bold">
          Beta: tell us what is missing
        </Link>
      ) : null}
      {children}
    </div>
  );
}
