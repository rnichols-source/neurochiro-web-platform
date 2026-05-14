import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(req: Request) {
  // Protect with admin secret
  const { email, tier, subscription_status } = await req.json()
  const authHeader = req.headers.get('authorization')

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // 1. Find the user
  const { data: profile, error: findError } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, tier, stripe_customer_id')
    .eq('email', email)
    .single()

  if (findError || !profile) {
    return NextResponse.json({ error: 'User not found', details: findError?.message }, { status: 404 })
  }

  // 2. Update their profile
  const updates: Record<string, any> = {}
  if (tier) updates.tier = tier

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ profile, message: 'No updates — returning current state' })
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update(updates as any)
    .eq('id', profile.id)

  if (updateError) {
    return NextResponse.json({ error: 'Update failed', details: updateError.message }, { status: 500 })
  }

  // 3. Also ensure students table record exists
  if (profile.role === 'student') {
    await supabase
      .from('students')
      .upsert({
        id: profile.id,
        user_id: profile.id,
        full_name: (profile as any).full_name || '',
        region_code: 'unknown',
      } as any, { onConflict: 'id' })
  }

  return NextResponse.json({
    success: true,
    before: { tier: (profile as any).tier },
    after: updates,
  })
}
