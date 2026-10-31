import { PORTAL_FEATURES, type FeatureState, type PortalFeature } from '@/config/portal-features';
import type { Membership } from '@/lib/portal/membership';

export type PortalNavContext = {
  membership: Membership;
  neurosTier: string | null;
  hasPurchase: boolean;
  chiroMatchOpen: boolean;
  unreadMessages: number;
  unreadNotifications: number;
  unreadReferrals?: number;
};

export type PortalNavItem = PortalFeature & {
  locked: boolean;
  effectiveState: FeatureState;
  badge?: number;
};

export function getFeature(key: string): PortalFeature | undefined {
  return PORTAL_FEATURES.find((feature) => feature.key === key);
}

export function requirementMet(feature: PortalFeature, ctx: PortalNavContext): boolean {
  if (!feature.requires) return true;
  if (feature.requires === 'pro') return ctx.membership.tier === 'pro' || ctx.membership.tier === 'neuros' || ctx.membership.isFounder;
  if (feature.requires === 'practice_tools') return ctx.membership.hasPracticeTools;
  if (feature.requires === 'neuros') return Boolean(ctx.neurosTier);
  if (feature.requires === 'owned_purchase') return ctx.hasPurchase;
  return true;
}

export function effectiveState(feature: PortalFeature, ctx: PortalNavContext): FeatureState {
  if (feature.key === 'neuros') return ctx.neurosTier ? 'live' : 'hidden';
  if (feature.key === 'purchases' && !ctx.hasPurchase) return 'hidden';
  return feature.state;
}

export function isVisible(feature: PortalFeature, ctx: PortalNavContext): boolean {
  return effectiveState(feature, ctx) !== 'hidden';
}

export function navFor(ctx: PortalNavContext): PortalNavItem[] {
  return PORTAL_FEATURES.filter((feature) => feature.key !== 'notifications' && isVisible(feature, ctx) && effectiveState(feature, ctx) !== 'coming_soon').map((feature) => {
    const state = effectiveState(feature, ctx);
    const item: PortalNavItem = {
      ...feature,
      effectiveState: state,
      locked: !requirementMet(feature, ctx),
    };
    if (feature.key === 'messages') item.badge = ctx.unreadMessages;
    if (feature.key === 'referrals') item.badge = ctx.unreadReferrals;
    if (feature.key === 'leads') item.badge = undefined;
    return item;
  });
}

export function comingSoonFeatures(): PortalFeature[] {
  return PORTAL_FEATURES.filter((feature) => feature.state === 'coming_soon');
}
