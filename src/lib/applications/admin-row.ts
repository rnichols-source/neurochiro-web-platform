export type ApplicationStatus = 'draft' | 'under_review' | 'approved' | 'declined' | 'needs_action'

export type AdminApplicationRow = {
  id: string
  status: ApplicationStatus
  name: string
  email: string
  city: string
  country: string
  plan: string
  priceLabel: string
  cardOnFile: boolean
  years: number | null
  approach: string
  techniques: string
  scans: string
  address: string
  website: string
  instagram: string
  heardAbout: string
  whyJoin: string
  notes: string
  mobile: string
  smsConsent: string
  stoppedAt: string
  createdAt: string
}
