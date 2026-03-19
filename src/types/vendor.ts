export type VendorTier = 'basic' | 'professional' | 'featured_partner';

export type VendorCategory = 
  | 'Neurological Tech' 
  | 'Practice Management' 
  | 'EHR Systems' 
  | 'Marketing' 
  | 'Equipment' 
  | 'Supplements' 
  | 'Financial Services' 
  | 'Consulting';

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
