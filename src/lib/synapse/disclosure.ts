export type DisclosureKind = 'anchor' | 'ally' | 'sponsored' | 'proof-panel'

export function disclosureText(kind: DisclosureKind): string {
  if (kind === 'sponsored') return 'Sponsored · Paid partnership with NeuroChiro'
  if (kind === 'proof-panel') return 'Doctors in this panel received product at no cost.'
  const title = kind === 'ally' ? 'Synapse Ally' : 'Synapse Anchor'
  return `${title} · Paid partner. NeuroChiro is paid for this placement; members get a partner discount.`
}

export function socialDisclosure(vendorName: string): string {
  return `Paid partnership: ${vendorName} × NeuroChiro · neurochiro.co`
}
