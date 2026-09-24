/**
 * Controlled vocabulary for conditions treated.
 * Doctors pick from this list. No free text.
 * Cap: 12 conditions per profile.
 */

export const CONDITIONS_MAX = 12;

export const CONDITIONS_VOCABULARY = [
  // Pain & Musculoskeletal
  'Back Pain', 'Neck Pain', 'Headaches & Migraines', 'Sciatica', 'Joint Pain', 'Shoulder Pain',
  'Knee Pain', 'Carpal Tunnel', 'Fibromyalgia', 'Chronic Pain', 'TMJ / Jaw Pain', 'Whiplash',
  'Arthritis', 'Plantar Fasciitis',
  // Nervous System
  'Nervous System Dysfunction', 'Vertigo & Dizziness', 'Neuropathy', 'Numbness & Tingling',
  'Balance Issues', 'Concussion Recovery', 'Tinnitus',
  // Pediatric
  'Pediatric Nervous System Issues', 'Infant Colic & Reflux', 'Ear Infections', 'Torticollis',
  'Developmental Delays', 'ADHD & Focus Issues', 'Sensory Processing', 'Bedwetting',
  // Prenatal & Postpartum
  'Pregnancy Discomfort', 'Postpartum Recovery', 'Breech Positioning', 'Breastfeeding Challenges', 'Pelvic Pain',
  // Spine & Posture
  'Scoliosis', 'Postural Imbalances', 'Disc Issues', 'Spinal Misalignment',
  // Stress & Wellness
  'Sleep Issues', 'Anxiety & Stress', 'Chronic Fatigue',
  // Injury
  'Sports Injuries', 'Auto Accident Injuries', 'Work Injuries', 'Injury Recovery',
  // Whole Family
  'Family Wellness', 'Pediatric Wellness', 'Adult Wellness', 'Athletic Performance',
];

export function isValidCondition(term: string): boolean {
  return CONDITIONS_VOCABULARY.includes(term);
}
