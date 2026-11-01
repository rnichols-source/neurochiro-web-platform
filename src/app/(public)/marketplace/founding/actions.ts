'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { categoryKeyFromAlias } from '@/lib/synapse/categories'
import { isSynapseCountry } from '@/lib/synapse/config'
import { asLooseDb, type PostgrestError } from '@/lib/synapse/loose-db'

export async function applyAsFoundingVendor(data: {
  companyName: string;
  contactName: string;
  email: string;
  website: string;
  category: string;
  country?: string;
  description: string;
  phone?: string;
  pledged?: boolean;
}) {
  const supabase = createAdminClient();

  // Generate slug
  const slug = data.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  // Check if vendor already exists
  const { data: existing } = await supabase
    .from('vendors')
    .select('id')
    .or(`slug.eq.${slug},name.ilike.${data.companyName}`)
    .limit(1);

  if (existing && existing.length > 0) {
    return { error: 'This company is already in our marketplace. Contact us if you need help with your listing.' };
  }

  // Create vendor record — inactive until approved
  const categoryKey = categoryKeyFromAlias(data.category)
  if (!categoryKey) return { error: 'Pick a category from the list. An admin assigns anything marked Other.' }
  const country = data.country || 'US'
  if (!isSynapseCountry(country)) return { error: 'Pick a country.' }
  if (!data.pledged) return { error: 'The best-member-price pledge is required.' }

  const row = {
    id: crypto.randomUUID(),
    name: data.companyName,
    slug,
    website_url: data.website || null,
    short_description: data.description,
    categories: [categoryKey],
    country,
    tier: 'anchor',
    is_active: false,
    is_founding_vendor: true,
    vetting_status: 'applied',
    contact_email: data.email,
    contact_name: data.contactName,
    best_price_pledged_at: new Date().toISOString(),
    email: data.email,
    phone: data.phone || null,
  }
  const db = asLooseDb(supabase)
  let error: PostgrestError | null = (await db.from('vendors').insert(row)).error
  if (error && (error.code === '42703' || error.code === 'PGRST204')) {
    error = (await db.from('vendors').insert({
      id: row.id,
      name: row.name,
      slug: row.slug,
      website_url: row.website_url,
      short_description: row.short_description,
      categories: row.categories,
      tier: 'starter',
      is_active: false,
      is_founding_vendor: true,
      email: row.email,
      phone: row.phone,
    })).error
  }

  if (error) {
    if (error.code === '23503') {
      return { error: 'Create a NeuroChiro account, then apply again so we can attach the company to you.' }
    }
    return { error: 'Something went wrong. Please try again.' };
  }

  // Discord notification
  try {
    const discordUrl = process.env.DISCORD_WEBHOOK_URL;
    if (discordUrl) {
      await fetch(discordUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `🏅 **NEW FOUNDING VENDOR APPLICATION**\n\n**Company:** ${data.companyName}\n**Contact:** ${data.contactName}\n**Email:** ${data.email}\n**Website:** ${data.website || 'N/A'}\n**Category:** ${data.category}\n**Description:** ${data.description.slice(0, 200)}`,
        }),
      }).catch(() => {});
    }
  } catch {}

  return { success: true };
}
