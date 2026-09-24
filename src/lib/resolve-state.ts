/**
 * Resolves any state input to a canonical 2-letter US state code.
 * Accepts: "SC", "sc", "South Carolina", "south carolina", "southcarolina".
 * Returns: "SC" or null if unresolvable.
 *
 * This is the ONLY way to resolve state input for database queries.
 * The doctors.state column stores 2-letter codes. Never query it with full names.
 */

const NAME_TO_CODE: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
  'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
  'district of columbia': 'DC', 'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI',
  'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
  'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME',
  'maryland': 'MD', 'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN',
  'mississippi': 'MS', 'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE',
  'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM',
  'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
  'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI',
  'south carolina': 'SC', 'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX',
  'utah': 'UT', 'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA',
  'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY',
};

const VALID_CODES = new Set(Object.values(NAME_TO_CODE));

// Spell corrections
const SPELL_FIX: Record<string, string> = {
  'conneticut': 'CT', 'connecticut': 'CT', 'massachucetts': 'MA',
  'massachusets': 'MA', 'pensylvania': 'PA', 'pensilvania': 'PA',
  'californai': 'CA', 'flordia': 'FL', 'goergia': 'GA', 'illnois': 'IL',
  'michagan': 'MI', 'minesota': 'MN', 'misouri': 'MO', 'missisipi': 'MS',
  'tennesee': 'TN', 'tennesse': 'TN', 'virgina': 'VA', 'wiscosin': 'WI',
  'arizonia': 'AZ', 'colorodo': 'CO', 'louisianna': 'LA', 'oklohoma': 'OK',
  'oregeon': 'OR', 'washingon': 'WA',
  'northcarolina': 'NC', 'southcarolina': 'SC',
  'newyork': 'NY', 'newjersey': 'NJ',
};

export function resolveStateCode(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Already a valid 2-letter code
  const upper = trimmed.toUpperCase();
  if (upper.length === 2 && VALID_CODES.has(upper)) return upper;

  // Full name lookup
  const lower = trimmed.toLowerCase();
  if (NAME_TO_CODE[lower]) return NAME_TO_CODE[lower];

  // No-space version (e.g. "southcarolina")
  const noSpace = lower.replace(/\s+/g, '');
  if (SPELL_FIX[noSpace]) return SPELL_FIX[noSpace];
  if (SPELL_FIX[lower]) return SPELL_FIX[lower];

  // Try matching as a substring of a full name (e.g. "carolina" → ambiguous, return null)
  const matches = Object.entries(NAME_TO_CODE).filter(([name]) => name.includes(lower));
  if (matches.length === 1) return matches[0][1];

  return null;
}

/** For display: convert 2-letter code to full name. NOT for queries. */
export function stateCodeToName(code: string): string {
  const entry = Object.entries(NAME_TO_CODE).find(([, c]) => c === code.toUpperCase());
  return entry ? entry[0].replace(/\b\w/g, c => c.toUpperCase()) : code;
}
