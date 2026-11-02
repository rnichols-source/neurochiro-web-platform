export type Billing = 'paying' | 'trialing' | 'past_due' | 'founding-comped' | 'free' | 'pending' | 'mismatch' | 'unknown'

export type StatusFilter = '' | 'paying' | 'trialing' | 'past_due' | 'founding-comped' | 'free' | 'pending' | 'mismatch'

export type MapDoctor = {
  id: string
  name: string
  practice: string
  city: string
  state: string
  country: string
  lat: number
  lng: number
  verificationStatus: 'verified' | 'pending'
  specialties: string[]
  billing: Billing
}

export type DemandPoint = {
  id: string
  zip: string
  city: string
  state: string
  country: string
  lat: number
  lng: number
  confirmed: number
  pending: number
  count: number
}

export type MentionPoint = {
  id: string
  city: string
  state: string
  country: string
  lat: number
  lng: number
  count: number
}

export type GapSummary = {
  id: string
  label: string
  city: string
  zip: string
  state: string
  country: string
  lat: number
  lng: number
  demandCount: number
  nearestMiles: number | null
}

export type CoverageMapData = {
  doctors: MapDoctor[]
  demand: DemandPoint[]
  mentions: MentionPoint[]
  gaps: GapSummary[]
  gapRadius: number
  stripeOk: boolean
}

export type MissingCountryDoctor = {
  id: string
  name: string
  practice: string
  city: string
  state: string
  address: string
}

export function billingLabel(billing: Billing): string {
  switch (billing) {
    case 'paying':
      return 'Paying'
    case 'founding-comped':
      return 'Founding/Comped'
    case 'free':
      return 'Free'
    case 'pending':
      return 'Pending'
    case 'trialing':
      return 'Trialing'
    case 'past_due':
      return 'Past due'
    case 'mismatch':
      return 'Mismatch'
    default:
      return 'Unknown'
  }
}
