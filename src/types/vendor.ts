export type VendorTier = 'starter' | 'growth' | 'partner';

export type VendorCategory =
  | 'Tables & Equipment'
  | 'Imaging & Scans'
  | 'EHR & Software'
  | 'Marketing'
  | 'Supplements'
  | 'Education & Coaching'
  | 'Billing & Collections'
  | 'Legal & Compliance'
  | 'Office Supplies & Design'
  | 'Staffing & HR'
  | 'Financial Services'
  | 'Real Estate';

export const VENDOR_CATEGORIES: VendorCategory[] = [
  'Tables & Equipment',
  'Imaging & Scans',
  'EHR & Software',
  'Marketing',
  'Supplements',
  'Education & Coaching',
  'Billing & Collections',
  'Legal & Compliance',
  'Office Supplies & Design',
  'Staffing & HR',
  'Financial Services',
  'Real Estate',
];

export const VENDOR_TIERS = {
  starter: {
    name: 'Starter',
    price: 99,
    features: [
      'Verified vendor listing',
      'Company profile page',
      'Member discount code',
      'Monthly analytics report',
    ],
  },
  growth: {
    name: 'Growth',
    price: 249,
    features: [
      'Everything in Starter',
      'Featured in your category',
      'Vendor Spotlight email blast',
      'Publish articles & content',
      'Lead capture form',
      'Priority support',
    ],
  },
  partner: {
    name: 'Partner',
    price: 499,
    features: [
      'Everything in Growth',
      'Homepage placement',
      'Sponsor Spotlight section',
      'Co-branded content',
      'NeuroChiro Recommended badge',
      'Dedicated account manager',
      'Quarterly strategy call',
    ],
  },
} as const;

export interface Vendor {
  id: string;
  slug: string;
  name: string;
  logo_url: string;
  tier: VendorTier;
  categories: VendorCategory[];
  short_description: string;
  full_description: string;
  website_url: string;
  demo_url?: string;
  benefits: string[];
  gallery_images?: string[];
  testimonials?: {
    author: string;
    text: string;
    clinic: string;
  }[];
  is_partner: boolean; // "NeuroChiro Partner" badge
}

export interface VendorStats {
  vendor_id: string;
  profile_views: number;
  website_clicks: number;
  demo_requests: number;
  period: '30d' | '90d' | 'ytd';
}
