'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { categoryKeyFromAlias } from '@/lib/synapse/categories'
import { isSynapseCountry, type SynapseCountry } from '@/lib/synapse/config'
import { asLooseDb, asRow } from '@/lib/synapse/loose-db'

export async function submitSynapseApplication(formData: {
  companyName: string
  email: string
  contactName: string
  website: string
  category: string
  country: string
  description: string
  tier: 'anchor' | 'ally'
  pledged: boolean
}) {
  const categoryKey = categoryKeyFromAlias(formData.category)
  if (!categoryKey) return { error: 'Pick a category. Other needs an admin to assign a key during vetting.' }
  if (!isSynapseCountry(formData.country)) return { error: 'Pick a country.' }
  if (!formData.pledged) return { error: 'The best-member-price pledge is required.' }
  if (!formData.companyName || !formData.email) return { error: 'Company name and email are required.' }

  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = asLooseDb(createAdminClient())
  const slug = formData.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const now = new Date().toISOString()
  const row = {
    name: formData.companyName,
    slug,
    website_url: formData.website || null,
    short_description: formData.description.slice(0, 280),
    categories: [categoryKey],
    country: formData.country as SynapseCountry,
    tier: formData.tier,
    is_active: false,
    vetting_status: 'applied',
    contact_email: formData.email,
    contact_name: formData.contactName,
    best_price_pledged_at: now,
  }

  if (user) {
    const { data: existing } = await admin.from('vendors').select('id').eq('id', user.id).maybeSingle()
    const write = asRow<{ id: string }>(existing)
      ? await admin.from('vendors').update(row).eq('id', user.id)
      : await admin.from('vendors').insert({ ...row, id: user.id })
    if (write.error?.code === '42703' || write.error?.code === 'PGRST204') {
      const legacy = await admin.from('vendors').upsert({
        id: user.id,
        name: row.name,
        slug: row.slug,
        website_url: row.website_url,
        short_description: row.short_description,
        categories: row.categories,
        tier: 'starter',
        is_active: false,
      })
      if (legacy.error) return { error: 'Could not save the application.' }
      return { success: true, pendingColumns: true }
    }
    if (write.error) return { error: 'Could not save the application.' }
    return { success: true }
  }

  const { error } = await admin.from('vendors').insert({ ...row, id: crypto.randomUUID() })
  if (error) return { error: 'Create a NeuroChiro account, then apply again so we can attach the company to you.' }
  return { success: true }
}
