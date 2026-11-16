export type PageKind = 'home' | 'about' | 'faq' | 'services' | 'contact' | 'booking' | 'other'

export type PageDocument = {
  url: string
  html: string
  kind: PageKind
}

export type FaqEntry = {
  question: string
  answer: string
}

export type ExtractedProfile = {
  clinicName: string
  headshotUrl: string
  hours: string
  bookingUrl: string
  instagramUrl: string
  facebookUrl: string
  tiktokUrl: string
  certifications: string[]
  techniques: string[]
  firstVisitInfo: string
  firstVisitPrice: string
  acceptedPayment: string[]
  insuranceNetworks: string[]
  paymentModel: '' | 'cash' | 'insurance' | 'both'
  filesInsurance: boolean | null
  paymentPlans: boolean | null
  hasEveningHours: boolean | null
  hasWeekendHours: boolean | null
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  faqs: FaqEntry[]
  dossier: string
  /** Office number from the website or booking page. Never the application mobile. */
  practicePhone: string
  galleryUrls: string[]
}

export type VoiceDraft = {
  bio: string
  shortIntro: string
  philosophy: string
  faqs: FaqEntry[]
}

export type ResearchTargets = {
  about: string
  faq: string
  services: string
  contact: string
  booking: string
}
