const US_COUNTRIES = new Set([
  'us',
  'usa',
  'united states',
  'united states of america',
])

const US_STATE_BY_NAME: ReadonlyMap<string, string> = new Map([
  ['alabama', 'AL'],
  ['alaska', 'AK'],
  ['arizona', 'AZ'],
  ['arkansas', 'AR'],
  ['california', 'CA'],
  ['colorado', 'CO'],
  ['connecticut', 'CT'],
  ['delaware', 'DE'],
  ['district of columbia', 'DC'],
  ['florida', 'FL'],
  ['georgia', 'GA'],
  ['hawaii', 'HI'],
  ['idaho', 'ID'],
  ['illinois', 'IL'],
  ['indiana', 'IN'],
  ['iowa', 'IA'],
  ['kansas', 'KS'],
  ['kentucky', 'KY'],
  ['louisiana', 'LA'],
  ['maine', 'ME'],
  ['maryland', 'MD'],
  ['massachusetts', 'MA'],
  ['michigan', 'MI'],
  ['minnesota', 'MN'],
  ['mississippi', 'MS'],
  ['missouri', 'MO'],
  ['montana', 'MT'],
  ['nebraska', 'NE'],
  ['nevada', 'NV'],
  ['new hampshire', 'NH'],
  ['new jersey', 'NJ'],
  ['new mexico', 'NM'],
  ['new york', 'NY'],
  ['north carolina', 'NC'],
  ['north dakota', 'ND'],
  ['ohio', 'OH'],
  ['oklahoma', 'OK'],
  ['oregon', 'OR'],
  ['pennsylvania', 'PA'],
  ['rhode island', 'RI'],
  ['south carolina', 'SC'],
  ['south dakota', 'SD'],
  ['tennessee', 'TN'],
  ['texas', 'TX'],
  ['utah', 'UT'],
  ['vermont', 'VT'],
  ['virginia', 'VA'],
  ['washington', 'WA'],
  ['west virginia', 'WV'],
  ['wisconsin', 'WI'],
  ['wyoming', 'WY'],
])

const US_STATE_CODES = new Set(US_STATE_BY_NAME.values())

/** Empty stays empty. US aliases become US. Anything else is trimmed upper-case. */
export function normalizeCountry(value: string | null | undefined): string {
  if (value == null) return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (US_COUNTRIES.has(trimmed.toLowerCase())) return 'US'
  return trimmed.toUpperCase()
}

/** Full US state names become 2-letter codes. Unknown values stay trimmed upper-case. */
export function normalizeState(value: string | null | undefined): string {
  if (value == null) return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  const upper = trimmed.toUpperCase()
  if (US_STATE_CODES.has(upper)) return upper
  return US_STATE_BY_NAME.get(trimmed.toLowerCase()) || upper
}
