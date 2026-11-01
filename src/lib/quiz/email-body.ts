import { escapeHtml } from '../leads/validate.ts'

export type ResultsEmailDoctor = {
  name: string
  clinic: string | null
  city: string | null
  region: string | null
  distance: number | null
  unit: 'mi' | 'km'
  slug: string
}

export function resultsEmailContent(input: {
  postal: string
  doctors: ResultsEmailDoctor[]
  directoryHref: string
  mailingAddress: string
  unsubscribeUrl: string
}): { subject: string; html: string; text: string } {
  const subject = `Your NeuroChiro matches near ${input.postal}`
  const rows = input.doctors.map((doctor) => {
    const place = [doctor.city, doctor.region].filter(Boolean).join(', ')
    const distance = doctor.distance == null
      ? ''
      : `${doctor.distance} ${doctor.unit === 'km' ? 'km' : 'miles'} away`
    const url = `https://www.neurochiro.co/directory/${encodeURIComponent(doctor.slug)}?from=quiz_email`
    const clinic = doctor.clinic ? `${escapeHtml(doctor.clinic)}<br>` : ''
    return `<p style="margin:0 0 16px;font-size:15px;line-height:1.5;color:#1E2D3B;"><strong>${escapeHtml(doctor.name)}</strong><br>${clinic}${escapeHtml(place)}${distance ? ` · ${escapeHtml(distance)}` : ''}<br><a href="${url}" style="color:#D66829;">View profile</a></p>`
  }).join('')
  const seeAll = `https://www.neurochiro.co${input.directoryHref.startsWith('/') ? input.directoryHref : `/${input.directoryHref}`}`
  const html = `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;color:#1E2D3B;">
    <p style="font-size:16px;line-height:1.5;">Here are the nervous system chiropractors we found near ${escapeHtml(input.postal)}.</p>
    ${rows}
    <p style="margin:20px 0;"><a href="${escapeHtml(seeAll)}" style="color:#D66829;">See all doctors near ${escapeHtml(input.postal)}</a></p>
    <p style="font-size:13px;line-height:1.5;color:#4b5563;">${escapeHtml(input.mailingAddress)}</p>
    <p style="font-size:13px;line-height:1.5;"><a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#D66829;">Unsubscribe</a></p>
  </div>`
  const text = [
    `Here are the nervous system chiropractors we found near ${input.postal}.`,
    ...input.doctors.map((doctor) => {
      const place = [doctor.city, doctor.region].filter(Boolean).join(', ')
      const distance = doctor.distance == null ? '' : `${doctor.distance} ${doctor.unit === 'km' ? 'km' : 'miles'} away`
      const url = `https://www.neurochiro.co/directory/${doctor.slug}?from=quiz_email`
      return [doctor.name, doctor.clinic, place, distance, url].filter(Boolean).join(' — ')
    }),
    seeAll,
    input.mailingAddress,
    input.unsubscribeUrl,
  ].join('\n\n')
  return { subject, html, text }
}
