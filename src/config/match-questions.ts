// Answer keys are checked here. The migration does not enforce the JSON shape.
// Store keys, never labels.

export type Option = { key: string; label: string };
export type MatchSide = 'student' | 'doctor';

export type MatchAnswers = {
  technique: string[];
  patient_focus: string[];
  practice_model: string;
  practice_size: string;
  states: string[];
  relocate_anywhere: boolean;
  max_distance_miles: number | null;
  home_lat: number | null;
  home_lng: number | null;
  start_window: string;
  comp_model: string;
  care_explain: string;
  care_pace: string;
  looking_for: string[];
  offers: string[];
};

export const EMPTY_ANSWERS: MatchAnswers = {
  technique: [],
  patient_focus: [],
  practice_model: '',
  practice_size: '',
  states: [],
  relocate_anywhere: false,
  max_distance_miles: null,
  home_lat: null,
  home_lng: null,
  start_window: '',
  comp_model: '',
  care_explain: '',
  care_pace: '',
  looking_for: [],
  offers: [],
};

const TECHNIQUE_NAMES = [
  'Diversified',
  'Gonstead',
  'Thompson Drop Table',
  'Palmer Package',
  'Cox Flexion-Distraction',
  'Network Spinal',
  'Torque Release Technique',
  'Bio-Geometric Integration',
  'NUCCA',
  'Atlas Orthogonal',
  'Blair Upper Cervical',
  'Toggle Recoil / HIO',
  'Activator Methods',
  'Impulse Adjusting',
  'ArthroStim',
  'Active Release Technique',
  'Graston Technique / IASTM',
  'Dry Needling',
  'Tonal / NeuroChiro-style',
  'Other',
] as const;

export function optionKey(label: string): string {
  return label.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export const TECHNIQUE_OPTIONS: Option[] = TECHNIQUE_NAMES.map((label) => ({ key: optionKey(label), label }));

export const PATIENT_FOCUS: Option[] = [
  { key: 'families', label: 'Families' },
  { key: 'pediatrics', label: 'Pediatrics' },
  { key: 'pregnancy', label: 'Pregnancy' },
  { key: 'athletes', label: 'Athletes' },
  { key: 'seniors', label: 'Seniors' },
  { key: 'chronic', label: 'Chronic and complex cases' },
  { key: 'wellness', label: 'General wellness' },
];

export const PRACTICE_MODEL: Option[] = [
  { key: 'cash', label: 'Cash' },
  { key: 'mostly-cash', label: 'Mostly cash' },
  { key: 'mixed', label: 'Mixed' },
  { key: 'mostly-insurance', label: 'Mostly insurance' },
];

export const PRACTICE_SIZE: Option[] = [
  { key: 'solo', label: 'Solo' },
  { key: 'two-three', label: '2–3 doctors' },
  { key: 'four-plus', label: '4+ doctors' },
];

export const START_WINDOW: Option[] = [
  { key: 'now', label: 'Now' },
  { key: 'within-6-months', label: 'Within 6 months' },
  { key: '6-12-months', label: '6–12 months' },
  { key: '12-plus-months', label: '12+ months' },
];

export const COMP_MODEL: Option[] = [
  { key: 'salary', label: 'Salary' },
  { key: 'salary-bonus', label: 'Salary plus bonus' },
  { key: 'production', label: 'Percentage or production' },
  { key: 'open', label: 'Open' },
];

export const CARE_EXPLAIN: Option[] = [
  { key: 'nervous-system', label: 'Nervous-system-first' },
  { key: 'symptom', label: 'Symptom-first' },
  { key: 'both', label: 'Both' },
];

export const CARE_PACE: Option[] = [
  { key: 'high-volume', label: 'High volume' },
  { key: 'moderate', label: 'Moderate' },
  { key: 'long-visits', label: 'Long visits' },
];

export const LOOKING: Option[] = [
  { key: 'associateship', label: 'Associateship' },
  { key: 'internship', label: 'Internship or preceptorship' },
  { key: 'shadowing', label: 'Shadowing' },
  { key: 'mentorship', label: 'Mentorship' },
];

export const MODEL_KEYS = PRACTICE_MODEL.map((item) => item.key);
export const SIZE_KEYS = PRACTICE_SIZE.map((item) => item.key);
export const START_KEYS = START_WINDOW.map((item) => item.key);

export const US_STATES: Option[] = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'], ['CA', 'California'],
  ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'], ['DC', 'District of Columbia'], ['FL', 'Florida'],
  ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'],
  ['IA', 'Iowa'], ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'],
  ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'], ['MS', 'Mississippi'],
  ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'], ['NH', 'New Hampshire'],
  ['NJ', 'New Jersey'], ['NM', 'New Mexico'], ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'],
  ['OH', 'Ohio'], ['OK', 'Oklahoma'], ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'],
  ['SC', 'South Carolina'], ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'],
  ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'], ['WV', 'West Virginia'], ['WI', 'Wisconsin'],
  ['WY', 'Wyoming'],
].map(([key, label]) => ({ key, label }));

const GROUPS: Record<string, Option[]> = {
  technique: TECHNIQUE_OPTIONS,
  patient_focus: PATIENT_FOCUS,
  practice_model: PRACTICE_MODEL,
  practice_size: PRACTICE_SIZE,
  start_window: START_WINDOW,
  comp_model: COMP_MODEL,
  care_explain: CARE_EXPLAIN,
  care_pace: CARE_PACE,
  looking: LOOKING,
  state: US_STATES,
};

export function labelFor(group: string, key: string): string {
  return GROUPS[group]?.find((item) => item.key === key)?.label || '';
}

export const MATCH_STEPS = [
  'technique',
  'patient_focus',
  'practice_model',
  'practice_size',
  'location',
  'start_window',
  'comp_model',
  'care_style',
  'looking',
] as const;

export const OUTCOMES: Option[] = [
  { key: 'talked', label: 'We talked' },
  { key: 'shadow_booked', label: 'Shadow day booked' },
  { key: 'shadow_done', label: 'Shadow day done' },
  { key: 'interviewed', label: 'Interviewed' },
  { key: 'offer', label: 'Offer' },
  { key: 'hired', label: 'Hired' },
  { key: 'not_a_fit', label: 'Not a fit' },
  { key: 'no_reply', label: 'No reply' },
];

const KNOWN = {
  technique: new Set(TECHNIQUE_OPTIONS.map((item) => item.key)),
  patient_focus: new Set(PATIENT_FOCUS.map((item) => item.key)),
  practice_model: new Set(MODEL_KEYS),
  practice_size: new Set(SIZE_KEYS),
  start_window: new Set(START_KEYS),
  comp_model: new Set(COMP_MODEL.map((item) => item.key)),
  care_explain: new Set(CARE_EXPLAIN.map((item) => item.key)),
  care_pace: new Set(CARE_PACE.map((item) => item.key)),
  looking: new Set(LOOKING.map((item) => item.key)),
  state: new Set(US_STATES.map((item) => item.key)),
};

function asRecord(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return raw as Record<string, unknown>;
}

function keys(raw: unknown, allowed: Set<string>, max: number): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string' || !allowed.has(item) || out.includes(item)) continue;
    out.push(item);
    if (out.length >= max) break;
  }
  return out;
}

function one(raw: unknown, allowed: Set<string>): string {
  return typeof raw === 'string' && allowed.has(raw) ? raw : '';
}

function num(raw: unknown): number | null {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return null;
  return raw;
}

export function cleanAnswers(raw: unknown): { ok: true; answers: MatchAnswers } | { ok: false; error: string } {
  const row = asRecord(raw);
  const unknown = Object.keys(row).filter((key) => !(key in EMPTY_ANSWERS));
  if (unknown.length) return { ok: false, error: 'Those answers are not part of ChiroMatch.' };
  const distance = num(row.max_distance_miles);
  const answers: MatchAnswers = {
    technique: keys(row.technique, KNOWN.technique, 3),
    patient_focus: keys(row.patient_focus, KNOWN.patient_focus, 7),
    practice_model: one(row.practice_model, KNOWN.practice_model),
    practice_size: one(row.practice_size, KNOWN.practice_size),
    states: keys(row.states, KNOWN.state, 10),
    relocate_anywhere: row.relocate_anywhere === true,
    max_distance_miles: distance != null && distance >= 0 && distance <= 3000 ? Math.round(distance) : null,
    home_lat: num(row.home_lat),
    home_lng: num(row.home_lng),
    start_window: one(row.start_window, KNOWN.start_window),
    comp_model: one(row.comp_model, KNOWN.comp_model),
    care_explain: one(row.care_explain, KNOWN.care_explain),
    care_pace: one(row.care_pace, KNOWN.care_pace),
    looking_for: keys(row.looking_for, KNOWN.looking, 4),
    offers: keys(row.offers, KNOWN.looking, 4),
  };
  return { ok: true, answers };
}

export function profileComplete(side: MatchSide, answers: MatchAnswers, clinicState: string | null): boolean {
  if (!answers.technique.length || !answers.patient_focus.length) return false;
  if (!answers.practice_model || !answers.practice_size || !answers.start_window || !answers.comp_model) return false;
  if (!answers.care_explain || !answers.care_pace) return false;
  if (side === 'student') {
    const placed = answers.states.length > 0 || answers.relocate_anywhere || (answers.max_distance_miles != null && answers.home_lat != null && answers.home_lng != null);
    return placed && answers.looking_for.length > 0;
  }
  return Boolean(clinicState) && answers.offers.length > 0;
}
