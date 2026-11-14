import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase-admin'
import { profileCompleteness } from '@/lib/go-live/plan'

export async function ProfileCompleteness({ doctorId }: { doctorId: string }) {
  const admin = createAdminClient() as any
  const { data } = await admin
    .from('doctors')
    .select('clinic_name, bio, photo_url, specialties, hours, phone, address, city, booking_url, latitude, longitude, sms_alerts_enabled, lead_alert_phones')
    .eq('id', doctorId)
    .maybeSingle()
  if (!data) return null
  const specialties = Array.isArray(data.specialties) ? data.specialties.filter((item: unknown) => typeof item === 'string') : []
  const phones = Array.isArray(data.lead_alert_phones) ? data.lead_alert_phones : []
  const score = profileCompleteness({
    clinicName: data.clinic_name || '',
    bio: data.bio || '',
    photo: data.photo_url || '',
    specialties,
    hours: data.hours || '',
    phone: data.phone || '',
    address: data.address || '',
    city: data.city || '',
    bookingUrl: data.booking_url || '',
    latitude: data.latitude == null ? null : Number(data.latitude),
    longitude: data.longitude == null ? null : Number(data.longitude),
    textNumber: data.sms_alerts_enabled === true && phones.length > 0,
  })
  return (
    <section className="bg-white border border-portal-border rounded-xl p-4">
      <h2 className="text-lg font-bold text-portal-ink">Profile {score.percent}%</h2>
      <div className="mt-3 h-2 rounded-full bg-portal-surface overflow-hidden">
        <div className="h-full bg-portal-accent" style={{ width: `${score.percent}%` }} />
      </div>
      <ul className="mt-3 divide-y divide-portal-border">
        {score.fields.map((field) => (
          <li key={field.key}>
            <Link href={field.href} className="min-h-11 flex items-center justify-between gap-3 text-sm">
              <span className={field.done ? 'text-portal-muted line-through' : 'text-portal-ink'}>{field.label}</span>
              <span className="font-bold text-portal-accent">{field.done ? 'Done' : 'Fix'}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
