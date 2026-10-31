import { getPortalContext } from '@/lib/portal/context';
import { createAdminClient } from '@/lib/supabase-admin';
import BillingGuideClient from './BillingGuideClient';

export default async function BillingGuidePage() {
  const ctx = await getPortalContext();
  let ownsGuide = false;
  if (ctx?.userId) {
    const admin = createAdminClient() as any;
    const purchases = await admin
      .from('course_purchases')
      .select('id')
      .eq('user_id', ctx.userId)
      .eq('course_id', 'billing-guide')
      .limit(1);
    ownsGuide = !purchases.error && Array.isArray(purchases.data) && purchases.data.length > 0;
  }
  const hasAccess = Boolean(ctx?.membership.hasPracticeTools) || ownsGuide;
  return <BillingGuideClient hasAccess={hasAccess} />;
}
