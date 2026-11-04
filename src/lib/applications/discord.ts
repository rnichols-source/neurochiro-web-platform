export type DiscordApplication = {
  name: string
  email: string
  city: string
  state: string
  country: string
  plan: string | null
  currency: string | null
  priceLabel: string | null
  cardOnFile: boolean
  practiceApproach: string
  techniques: string
  usesNervousSystemScans: boolean | null
  scanTypes: string
  yearsInPractice: number | null
  officeAddress: string
  website: string
  instagram: string
  heardAbout: string
  whyJoin: string
}

function clip(value: string, max: number): string {
  const clean = value.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean || '—'
  return `${clean.slice(0, max - 1)}…`
}

export function applicationDiscordMessage(app: DiscordApplication): string {
  const scans = app.usesNervousSystemScans
    ? `Yes (${clip(app.scanTypes, 120)})`
    : app.usesNervousSystemScans === false
      ? 'No'
      : '—'
  const lines = [
    '**New doctor application — under review**',
    `**Name:** ${clip(app.name, 80)}`,
    `**Email:** ${clip(app.email, 120)}`,
    `**Office:** ${clip(app.officeAddress, 160)}`,
    `**City / country:** ${clip([app.city, app.state].filter(Boolean).join(', '), 120)} / ${clip(app.country, 40)}`,
    `**Plan:** ${clip(app.priceLabel || `${app.plan || '—'} ${app.currency || ''}`, 80)}`,
    `**Card on file:** ${app.cardOnFile ? 'Yes' : 'No'}`,
    `**Approach:** ${clip(app.practiceApproach, 400)}`,
    `**Techniques:** ${clip(app.techniques, 200)}`,
    `**Nervous system scans:** ${scans}`,
    `**Years in practice:** ${app.yearsInPractice ?? '—'}`,
    `**Website:** ${clip(app.website, 160)}`,
    `**Instagram:** ${clip(app.instagram, 80)}`,
    `**Heard about NeuroChiro:** ${clip(app.heardAbout, 200)}`,
    `**Why they want to join:** ${clip(app.whyJoin, 500)}`,
    'Review: https://neurochiro.co/admin/applications',
  ]
  const message = lines.join('\n')
  return message.length <= 1900 ? message : `${message.slice(0, 1899)}…`
}
