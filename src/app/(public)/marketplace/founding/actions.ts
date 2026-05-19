'use server'

import { createAdminClient } from '@/lib/supabase-admin'

export async function applyAsFoundingVendor(data: {
  companyName: string;
  contactName: string;
  email: string;
  website: string;
  category: string;
  description: string;
  phone?: string;
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
  const { error } = await (supabase as any).from('vendors').insert({
    id: crypto.randomUUID(),
    name: data.companyName,
    slug,
    website_url: data.website || null,
    short_description: data.description,
    categories: data.category ? [data.category] : [],
    tier: 'starter',
    is_active: false,
    is_founding_vendor: true,
    email: data.email,
    phone: data.phone || null,
  });

  if (error) {
    console.error('Founding vendor insert error:', error);
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
