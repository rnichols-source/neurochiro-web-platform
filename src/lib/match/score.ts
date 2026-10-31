import {
  labelFor,
  MODEL_KEYS,
  SIZE_KEYS,
  START_KEYS,
} from '../../config/match-questions.ts';

export const SCORE_VERSION = 'v1';

export const WEIGHTS_V1 = {
  technique: 25,
  patient_focus: 15,
  practice_model: 15,
  location: 15,
  start_window: 10,
  comp_model: 10,
  practice_size: 5,
  care_style: 5,
} as const;

export type FactorKey = keyof typeof WEIGHTS_V1;
export type Weights = Record<FactorKey, number>;

export type ScoreSide = {
  technique: string[];
  patientFocus: string[];
  practiceModel: string;
  practiceSize: string;
  states: string[];
  relocateAnywhere: boolean;
  maxDistanceMiles: number | null;
  homeLat: number | null;
  homeLng: number | null;
  clinicState: string | null;
  clinicLat: number | null;
  clinicLng: number | null;
  startWindow: string;
  compModel: string;
  careExplain: string;
  carePace: string;
  offers: string[];
  lookingFor: string[];
};

export type ScoreResult = {
  pct: number;
  factors: Record<FactorKey, number>;
  reasons: string[];
  excluded?: 'location' | 'offer';
};

const FACTOR_ORDER: FactorKey[] = [
  'technique',
  'patient_focus',
  'practice_model',
  'location',
  'start_window',
  'comp_model',
  'practice_size',
  'care_style',
];

export function inTonalFamily(key: string): boolean {
  return key === 'tonal' || key.startsWith('tonal-') || key.includes('network-spinal') || key.includes('torque-release');
}

function zeros(): Record<FactorKey, number> {
  return {
    technique: 0,
    patient_focus: 0,
    practice_model: 0,
    location: 0,
    start_window: 0,
    comp_model: 0,
    practice_size: 0,
    care_style: 0,
  };
}

function jaccard(a: string[], b: string[]): number {
  const left = new Set(a);
  const right = new Set(b);
  if (!left.size || !right.size) return 0;
  let shared = 0;
  for (const key of left) if (right.has(key)) shared += 1;
  return shared / (left.size + right.size - shared);
}

export function techniqueFactor(a: string[], b: string[]): number {
  const left = [...new Set(a)];
  const right = [...new Set(b)];
  if (!left.length || !right.length) return 0;
  let num = 0;
  for (const item of left) {
    let best = 0;
    for (const other of right) {
      if (item === other) best = 1;
      else if (best < 0.5 && inTonalFamily(item) && inTonalFamily(other)) best = 0.5;
    }
    num += best;
  }
  return num / Math.max(left.length, right.length);
}

function scale(keys: string[], left: string, right: string, adjacent: number, twoStep: number): number {
  const a = keys.indexOf(left);
  const b = keys.indexOf(right);
  if (a < 0 || b < 0) return 0;
  const gap = Math.abs(a - b);
  if (gap === 0) return 1;
  if (gap === 1) return adjacent;
  if (gap === 2) return twoStep;
  return 0;
}

export function milesBetween(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const rad = (value: number) => (value * Math.PI) / 180;
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 3958.8 * Math.asin(Math.min(1, Math.sqrt(h)));
}

function locationFactor(student: ScoreSide, doctor: ScoreSide): { value: number; excluded: boolean } {
  const clinic = (doctor.clinicState || '').toUpperCase();
  const states = student.states.map((state) => state.toUpperCase());
  if (clinic && states.includes(clinic)) return { value: 1, excluded: false };
  if (student.relocateAnywhere) return { value: 0.7, excluded: false };
  const max = student.maxDistanceMiles;
  if (
    max != null && max > 0 &&
    student.homeLat != null && student.homeLng != null &&
    doctor.clinicLat != null && doctor.clinicLng != null
  ) {
    const miles = milesBetween(student.homeLat, student.homeLng, doctor.clinicLat, doctor.clinicLng);
    if (miles <= max) return { value: 0.8 * (1 - miles / max), excluded: false };
  }
  return { value: 0, excluded: true };
}

function humanList(items: string[]): string {
  if (items.length <= 1) return items[0] || '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function phrase(key: FactorKey, student: ScoreSide, doctor: ScoreSide): string {
  if (key === 'patient_focus') {
    const shared = student.patientFocus.filter((item) => doctor.patientFocus.includes(item));
    const labels = shared.map((item) => labelFor('patient_focus', item).toLowerCase()).filter(Boolean);
    return labels.length ? `focus on ${humanList(labels)}` : '';
  }
  if (key === 'practice_model') {
    const label = labelFor('practice_model', student.practiceModel).toLowerCase();
    return label ? `a ${label} practice` : '';
  }
  if (key === 'technique') {
    const shared = student.technique.filter((item) => doctor.technique.includes(item) || (inTonalFamily(item) && doctor.technique.some(inTonalFamily)));
    const labels = shared.map((item) => labelFor('technique', item)).filter(Boolean);
    const shown = labels.length ? labels : student.technique.map((item) => labelFor('technique', item)).filter(Boolean);
    return shown.length ? `use ${humanList(shown.slice(0, 2))}` : '';
  }
  if (key === 'location') {
    const state = labelFor('state', (doctor.clinicState || '').toUpperCase());
    return state ? `in ${state}` : 'in the same state';
  }
  if (key === 'start_window') {
    const label = labelFor('start_window', student.startWindow).toLowerCase();
    return label ? `are ready ${label}` : '';
  }
  if (key === 'comp_model') {
    const label = labelFor('comp_model', student.compModel === 'open' ? doctor.compModel : student.compModel).toLowerCase();
    return label ? `agree on ${label} pay` : '';
  }
  if (key === 'practice_size') {
    const label = labelFor('practice_size', student.practiceSize).toLowerCase();
    return label ? `want a ${label} clinic` : '';
  }
  return 'explain care the same way';
}

export function reasonSentence(keys: FactorKey[], student: ScoreSide, doctor: ScoreSide): string {
  const bits = keys.map((key) => phrase(key, student, doctor)).filter(Boolean);
  if (!bits.length) return '';
  return `Both ${bits.join(' and ')}.`.replace(' and in ', ' in ');
}

export function scoreMatch(student: ScoreSide, doctor: ScoreSide, weights: Weights = WEIGHTS_V1): ScoreResult {
  const factors = zeros();
  const offered = new Set(doctor.offers);
  if (!student.lookingFor.some((item) => offered.has(item))) {
    return { pct: 0, factors, reasons: [], excluded: 'offer' };
  }
  const location = locationFactor(student, doctor);
  if (location.excluded) return { pct: 0, factors, reasons: [], excluded: 'location' };

  factors.technique = techniqueFactor(student.technique, doctor.technique);
  factors.patient_focus = jaccard(student.patientFocus, doctor.patientFocus);
  factors.practice_model = scale(MODEL_KEYS, student.practiceModel, doctor.practiceModel, 0.6, 0.2);
  factors.location = location.value;
  factors.start_window = scale(START_KEYS, student.startWindow, doctor.startWindow, 0.5, 0);
  factors.comp_model = student.compModel && student.compModel === doctor.compModel && student.compModel !== 'open'
    ? 1
    : student.compModel === 'open' || doctor.compModel === 'open'
      ? 0.7
      : 0;
  factors.practice_size = scale(SIZE_KEYS, student.practiceSize, doctor.practiceSize, 0.5, 0);
  const explain = student.careExplain && student.careExplain === doctor.careExplain ? 1 : 0;
  const pace = student.carePace && student.carePace === doctor.carePace ? 1 : 0;
  factors.care_style = (explain + pace) / 2;

  const pct = Math.max(0, Math.min(100, Math.round(FACTOR_ORDER.reduce((sum, key) => sum + weights[key] * factors[key], 0))));
  const top = FACTOR_ORDER
    .filter((key) => factors[key] >= 0.75)
    .sort((a, b) => factors[b] - factors[a] || weights[b] - weights[a] || FACTOR_ORDER.indexOf(a) - FACTOR_ORDER.indexOf(b))
    .slice(0, 2);
  const line = reasonSentence(top, student, doctor);
  return { pct, factors, reasons: line ? [line] : [] };
}
