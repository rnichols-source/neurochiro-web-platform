import PageHeader from '@/components/portal/PageHeader';
import { PORTAL_FEATURES } from '@/config/portal-features';
import { effectiveState } from '@/lib/portal/features';
import { getPortalContext, toNavContext } from '@/lib/portal/context';
import NotifyButton from './NotifyButton';

export default async function ComingSoonPage() {
  const ctx = await getPortalContext();
  const navCtx = ctx ? toNavContext(ctx) : null;
  const features = PORTAL_FEATURES.filter((feature) => navCtx && effectiveState(feature, navCtx) === 'coming_soon' && feature.comingSoonBlurb);

  return (
    <div className="space-y-4">
      <PageHeader title="Coming soon" description="These are on the list. Ask us to tell you when one opens." />
      {features.length === 0 ? <p className="text-sm text-portal-ink-2">Nothing waiting right now.</p> : null}
      {features.map((feature) => (
        <article key={feature.key} id={feature.key} className="bg-white border border-portal-border rounded-xl p-4">
          <h2 className="text-lg font-bold">{feature.label}</h2>
          <p className="mt-1 text-sm text-portal-ink-2">{feature.comingSoonBlurb}</p>
          <div className="mt-3"><NotifyButton featureKey={feature.key} /></div>
        </article>
      ))}
    </div>
  );
}
