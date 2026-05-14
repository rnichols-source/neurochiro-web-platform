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
      'Listed in the marketplace directory',
      'Company profile page with product showcase',
      'Discount code displayed to 140+ doctors',
      'Monthly views & click analytics',
      'Listed on NeuroChiro Instagram highlights',
    ],
  },
  growth: {
    name: 'Growth',
    price: 249,
    features: [
      'Everything in Starter',
      'Featured at the top of your category — doctors see you first',
      'Monthly email blast to all doctors in your category',
      'Lead capture — doctors contact you directly',
      'Monthly Instagram promotion (post + story)',
      'Vendor Spotlight interview on your marketplace page',
      'Priority support',
    ],
  },
  partner: {
    name: 'Partner',
    price: 499,
    features: [
      'Everything in Growth',
      'Featured on the NeuroChiro homepage',
      '"NeuroChiro Recommended" badge on your listing',
      'Weekly Instagram promotion (4x/month posts + stories)',
      'Sponsor a NeuroChiro Spotlight episode',
      'Personal introductions to top practices in your category',
      'Dedicated account manager',
      'Quarterly strategy call with the NeuroChiro team',
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
