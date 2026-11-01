import { SYNAPSE_CATEGORIES, categoryLabel } from '@/lib/synapse/categories'

export type VendorTier = 'anchor' | 'ally'
export type LegacyVendorTier = VendorTier | 'starter' | 'growth' | 'partner' | 'free' | 'featured' | 'basic'

export type VendorCategory = string

/** Canonical category keys. Labels come from src/lib/synapse/categories.ts. */
export const VENDOR_CATEGORIES: VendorCategory[] = SYNAPSE_CATEGORIES.map((category) => category.key)

export const VENDOR_CATEGORY_OPTIONS = SYNAPSE_CATEGORIES.map((category) => ({
  key: category.key,
  label: category.label,
}))

export function vendorCategoryLabel(key: string): string {
  return categoryLabel(key)
}

export interface Vendor {
  id: string
  slug: string
  name: string
  logo_url: string
  tier: LegacyVendorTier
  categories: VendorCategory[]
  short_description: string
  full_description: string
  website_url: string
  demo_url?: string
  benefits: string[]
  gallery_images?: string[]
  testimonials?: {
    author: string
    text: string
    clinic: string
  }[]
  is_partner: boolean
}

export interface VendorStats {
  vendor_id: string
  profile_views: number
  website_clicks: number
  demo_requests: number
  period: '30d' | '90d' | 'ytd'
}
