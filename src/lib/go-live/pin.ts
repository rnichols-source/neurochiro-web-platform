import 'server-only'

import { createAdminClient } from '@/lib/supabase-admin'
import { geocodeDoctorAddress } from '@/lib/geocode'

export async function pinDoctor(doctorId: string, address: string, city: string, state: string, country: string): Promise<boolean> {
  if (!doctorId || address.trim().length < 4 || city.trim().length < 2) return false
  const region = country.trim().toUpperCase() === 'OTHER' ? 'US' : (country || 'US')
  try {
    const point = await geocodeDoctorAddress(address, city, state, region)
    if (!point) return false
    const admin = createAdminClient() as any
    const updated = await admin.from('doctors').update({ latitude: point.lat, longitude: point.lng }).eq('id', doctorId)
    if (updated.error) {
      console.error('[go-live] map pin save failed', updated.error.code || 'error')
      return false
    }
    return true
  } catch (error) {
    console.error('[go-live] map pin failed', error instanceof Error ? error.name : 'error')
    return false
  }
}
