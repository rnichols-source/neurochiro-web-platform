/**
 * Controlled vocabulary for doctor specialties.
 * Doctors pick from this list. No free text.
 * Cap: 6 specialties per profile to prevent tag soup.
 */

export const SPECIALTY_MAX = 8;

export interface SpecialtyCategory {
  label: string;
  terms: string[];
}

export const SPECIALTY_VOCABULARY: SpecialtyCategory[] = [
  {
    label: 'Who You Serve',
    terms: [
      'Pediatric',
      'Prenatal & Perinatal',
      'Postpartum',
      'Family Wellness',
      'Athletes & Sports',
      "Women's Health",
      'Teens',
      'Animal Chiropractic',
    ],
  },
  {
    label: 'Approach',
    terms: [
      'Nervous System Focused',
      'Upper Cervical',
      'Tonal',
      'Network Spinal',
      'Torque Release Technique',
      'Structural & Corrective',
      'Gonstead',
      'Webster Technique',
      'Zone Technique',
      'Applied Kinesiology',
      'Low-Force & Instrument',
      'Functional Neurology',
      'Functional Medicine',
      'Clinical Nutrition',
      'Neuro Emotional Technique',
    ],
  },
  {
    label: 'Features',
    terms: [
      'INSiGHT Scanning',
      'Neurodevelopmental',
      'Cranial & Tongue Tie',
      'Concussion Recovery',
      'Injury Recovery',
      'Chronic Pain Recovery',
    ],
  },
  {
    label: 'Services',
    terms: [
      'Spinal Decompression',
      'PEMF',
      'Cold Laser',
      'Pilates',
      'CBCT 3D Imaging',
      'Tytron Thermography',
    ],
  },
];

/** Flat list of all valid specialty terms */
export const ALL_SPECIALTY_TERMS = SPECIALTY_VOCABULARY.flatMap(c => c.terms);

/** Check if a term is in the vocabulary */
export function isValidSpecialty(term: string): boolean {
  return ALL_SPECIALTY_TERMS.includes(term);
}

/**
 * Mapping from existing free-text tags to vocabulary terms.
 * Key: lowercase normalized tag. Value: vocabulary term or null (review queue).
 */
export const TAG_MAPPING: Record<string, string | null> = {
  // Population
  'pediatric': 'Pediatric',
  'pediatrics': 'Pediatric',
  'pediatric chiro': 'Pediatric',
  'pediatric chiropractic': 'Pediatric',
  'neurologically base pediatric': 'Pediatric',
  'pediatric + developmental care': 'Pediatric',
  'prenatal': 'Prenatal & Perinatal',
  'pregnancy': 'Prenatal & Perinatal',
  'prenatal + perinatal support': 'Prenatal & Perinatal',
  'pre/post-natal': 'Prenatal & Perinatal',
  'perinatal': 'Prenatal & Perinatal',
  'preconception': 'Prenatal & Perinatal',
  'prenatal care': 'Prenatal & Perinatal',
  'prenatal / webster technique': 'Prenatal & Perinatal',
  'prenatal/pregnancy': 'Prenatal & Perinatal',
  'postpartum': 'Postpartum',
  'post-partum': 'Postpartum',
  'postnatal': 'Postpartum',
  'family wellness': 'Family Wellness',
  'family nervous system wellness': 'Family Wellness',
  'family': 'Family Wellness',
  'families': 'Family Wellness',
  'family care': 'Family Wellness',
  'family chiropractic': 'Family Wellness',
  'whole family chiropractic': 'Family Wellness',
  'family based': 'Family Wellness',
  'family health care': 'Family Wellness',
  'sports': 'Athletes & Sports',
  'sports performance': 'Athletes & Sports',
  'athletes': 'Athletes & Sports',
  'athletic': 'Athletes & Sports',
  'athletic performance': 'Athletes & Sports',
  "women's health": "Women's Health",
  "women's wellness": "Women's Health",
  'teens': 'Teens',
  'animal chiropractic care': 'Animal Chiropractic',
  'animal chiropractic': 'Animal Chiropractic',

  // Approach
  'nervous system': 'Nervous System Focused',
  'nervous system wellness': 'Nervous System Focused',
  'neurologically-focused': 'Nervous System Focused',
  'nervous system chiropractic': 'Nervous System Focused',
  'nervous-system-first care': 'Nervous System Focused',
  'nervous system focused': 'Nervous System Focused',
  'nervous system-based care': 'Nervous System Focused',
  'nervous system-centered care': 'Nervous System Focused',
  'nervous system & wellness focused care': 'Nervous System Focused',
  'neurologically focused chiropractic care': 'Nervous System Focused',
  'nervous system rehabilitation': 'Nervous System Focused',
  'nervous system optimization': 'Nervous System Focused',
  'general neurochiro': 'Nervous System Focused',
  'upper cervical': 'Upper Cervical',
  'upper cervical specific': 'Upper Cervical',
  'nucca upper cervical chiropractic': 'Upper Cervical',
  'atlas orthogonal chiropractic': 'Upper Cervical',
  'orthospinology': 'Upper Cervical',
  'blair upper cervical': 'Upper Cervical',
  'knee chest upper cervical & side posture toggle': 'Upper Cervical',
  'knee-chest technique': 'Upper Cervical',
  'tonal': 'Tonal',
  'tonal analysis and adjustment': 'Tonal',
  'network spinal': 'Network Spinal',
  'nsa level iii': 'Network Spinal',
  'torque release technique': 'Torque Release Technique',
  'structural + postural restoration': 'Structural & Corrective',
  'postural restoration': 'Structural & Corrective',
  'corrective care': 'Structural & Corrective',
  'corrective': 'Structural & Corrective',
  'cbp': 'Structural & Corrective',
  'chiropractic biophysics': 'Structural & Corrective',
  'gonstead technique': 'Gonstead',
  'gonstead': 'Gonstead',
  'webster technique': 'Webster Technique',
  'webster technique onsite': 'Webster Technique',
  'zone technique': 'Zone Technique',
  'applied kinesiology': 'Applied Kinesiology',
  'activator': 'Low-Force & Instrument',
  'instrument assisted adjustments': 'Low-Force & Instrument',
  'low-force & instrument': 'Low-Force & Instrument',
  'diversified': null, // too generic, review
  'functional neurology': 'Functional Neurology',
  'functional medicine': 'Functional Medicine',
  'clinical nutrition': 'Clinical Nutrition',

  // Features
  'insight scans': 'INSiGHT Scanning',
  'insight scanning': 'INSiGHT Scanning',
  'hrv testing': 'INSiGHT Scanning',
  'neurodevelopmental': 'Neurodevelopmental',
  'neurodivergence': 'Neurodevelopmental',
  'adhd & sensory processing': 'Neurodevelopmental',
  'cranial': 'Cranial & Tongue Tie',
  'tongue tie analysis': 'Cranial & Tongue Tie',
  'palate': 'Cranial & Tongue Tie',
  'concussion recovery': 'Concussion Recovery',
  'concussion': 'Concussion Recovery',
  'injury recovery': 'Injury Recovery',
  'auto injury': 'Injury Recovery',
  'pre/post-op care': 'Injury Recovery',

  // Services
  'spinal decompression': 'Spinal Decompression',
  'pemf': 'PEMF',
  'cold laser': 'Cold Laser',
  'pilates': 'Pilates',
  'cbct 3d imaging': 'CBCT 3D Imaging',

  // Explicit drops → null (review queue)
  'chiropractic': null,
  'chiropractic care': null,
  'holistic chiropractic': null,
  'holistic chiropractic care': null,
  'holistic wellness': null,
  'wellness': null,
  'wellness care': null,
  'vitalistic': null,
  'subluxation-based': null,
  'root cause care': null,
  'whole-being chiropractic': null,
  'preventative wellness': null,
  'cash practice': null, // map to payment fields
  'neuro emotional technique': null,
  'somato respiratory integration': null,
  'root cause protocol': null,
  'life coaching': null,
  'equestrian': null,
  'icpa': null,
  'developmental care': null,

  // Doctor-to-doctor services → flag in admin
  'provider wellness': null,
  'burnout recovery': null,
  'nervous system education': null,
};

/**
 * Map a raw tag to a vocabulary term.
 * Returns: { term: string } if mapped, { review: string } if unmapped, or null if empty.
 */
export function mapTag(raw: string): { term: string } | { review: string } | null {
  const cleaned = raw.trim();
  if (!cleaned) return null;

  // Exact match in vocabulary
  if (ALL_SPECIALTY_TERMS.includes(cleaned)) return { term: cleaned };

  // Lookup in mapping
  const key = cleaned.toLowerCase();
  if (key in TAG_MAPPING) {
    const mapped = TAG_MAPPING[key];
    return mapped ? { term: mapped } : { review: cleaned };
  }

  // If it's a long sentence or contains certain patterns, send to review
  if (cleaned.length > 50 || /\.\s|,\s.*,/.test(cleaned)) {
    return { review: cleaned };
  }

  // Unrecognized short tag → review
  return { review: cleaned };
}
