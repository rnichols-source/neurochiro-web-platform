export type CategoryClass = 'core' | 'standard'

export type SynapseCategory = {
  key: string
  label: string
  class: CategoryClass
  aliases: string[]
}

export const SYNAPSE_CATEGORIES: SynapseCategory[] = [
  { key: 'neuro-scanning', label: 'Neuro Scanning Technology', class: 'core', aliases: ['Imaging & Scans', 'Scanning Technology'] },
  { key: 'tables', label: 'Adjusting Tables', class: 'core', aliases: ['Tables & Equipment', 'Chiropractic Tables & Equipment'] },
  { key: 'instruments', label: 'Adjusting Instruments', class: 'core', aliases: [] },
  { key: 'supplements', label: 'Professional Supplements', class: 'core', aliases: ['Supplements', 'Supplements & Nutrition'] },
  { key: 'software', label: 'Practice Software & EHR', class: 'core', aliases: ['EHR & Software', 'Practice Management Software'] },
  { key: 'patient-engagement', label: 'Patient Engagement', class: 'standard', aliases: ['Patient Engagement'] },
  { key: 'marketing', label: 'Marketing & Branding', class: 'standard', aliases: ['Marketing', 'Marketing & Branding'] },
  { key: 'education', label: 'Education & Coaching', class: 'standard', aliases: ['Education & Coaching', 'Education & Training'] },
  { key: 'billing', label: 'Billing & Collections', class: 'standard', aliases: ['Billing & Collections', 'Billing & Insurance'] },
  { key: 'launch-finance', label: 'Practice Launch & Finance', class: 'standard', aliases: ['Financial Services', 'Real Estate'] },
  { key: 'legal-hr', label: 'Legal, Compliance & HR', class: 'standard', aliases: ['Legal & Compliance', 'Staffing & HR'] },
  { key: 'orthotics-recovery', label: 'Orthotics, Supports & Recovery', class: 'standard', aliases: ['Orthotics & Supports'] },
  { key: 'office-apparel', label: 'Office, Design & Apparel', class: 'standard', aliases: ['Office Supplies & Design', 'Office Supplies & Décor', 'Apparel & Merchandise'] },
]

const byKey = new Map(SYNAPSE_CATEGORIES.map((category) => [category.key, category]))

function norm(value: string): string {
  return value.trim().toLowerCase()
}

export function categoryByKey(key: string): SynapseCategory | null {
  return byKey.get(key) ?? null
}

/** Map a stored label or key onto the canonical key. "Other" and unknown text return null. */
export function categoryKeyFromAlias(value: string | null | undefined): string | null {
  if (!value) return null
  const needle = norm(value)
  if (needle === 'other') return null
  for (const category of SYNAPSE_CATEGORIES) {
    if (norm(category.key) === needle || norm(category.label) === needle) return category.key
    if (category.aliases.some((alias) => norm(alias) === needle)) return category.key
  }
  return null
}

export function categoryLabel(key: string | null | undefined): string {
  if (!key) return ''
  return categoryByKey(key)?.label || key
}

export function categoryClass(key: string): CategoryClass | null {
  return categoryByKey(key)?.class ?? null
}
