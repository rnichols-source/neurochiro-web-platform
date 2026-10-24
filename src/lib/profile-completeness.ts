/**
 * Single source of truth for profile completeness.
 * Used by: profile editor widget AND profile-nudger cron.
 * If these two disagree, a doctor sees "complete" on screen while
 * getting an email saying it is not. That must never happen.
 */

export interface CompletenessCheck {
  key: string
  done: boolean
  label: string
  why: string
  nudgeSubject?: string
  nudgeBody?: string
}

export function getProfileCompleteness(doctor: {
  photo_url?: string | null
  bio?: string | null
  short_intro?: string | null
  chiropractic_school?: string | null
  specialties?: string[] | null
  hours?: string | null
  first_visit_price?: string | null
  payment_model?: string | null
  phone?: string | null
  booking_url?: string | null
  google_reviews_url?: string | null
}): { checks: CompletenessCheck[]; score: number; missing: CompletenessCheck[] } {
  const checks: CompletenessCheck[] = [
    {
      key: 'photo',
      done: !!doctor.photo_url,
      label: 'Profile photo',
      why: 'Profiles with photos get 3x more patient views',
      nudgeSubject: 'Add your photo — profiles with photos get 3x more clicks',
      nudgeBody: 'Your NeuroChiro profile is live, but it is missing a photo. Profiles with photos get 3x more patient clicks than those without. It takes 30 seconds to upload one.',
    },
    {
      key: 'bio',
      done: !!(doctor.bio && doctor.bio.length >= 20) || !!(doctor.short_intro && doctor.short_intro.length >= 20),
      label: 'Bio or intro',
      why: 'Tells patients who you are and what you do',
      nudgeSubject: 'Your profile needs a bio — patients want to know your story',
      nudgeBody: 'Your NeuroChiro profile has a great photo, but patients want to know more about you. A bio helps them decide if you are the right fit.',
    },
    {
      key: 'specialties',
      done: (doctor.specialties || []).length > 0,
      label: 'Specialties',
      why: 'Helps patients find you when searching',
      nudgeSubject: 'Add your specialties so the right patients find you',
      nudgeBody: 'Your NeuroChiro profile looks great. One more thing — adding your specialties helps patients searching for specific care find you faster.',
    },
    {
      key: 'education',
      done: !!doctor.chiropractic_school,
      label: 'Education',
      why: 'Builds trust — patients want to know where you trained',
    },
    {
      key: 'hours',
      done: !!doctor.hours,
      label: 'Office hours',
      why: 'Patients check hours before calling',
    },
    {
      key: 'cost',
      done: !!doctor.first_visit_price || !!doctor.payment_model,
      label: 'Cost & insurance',
      why: 'The #1 question patients have before booking',
    },
    {
      key: 'phone',
      done: !!doctor.phone,
      label: 'Phone number',
      why: 'Many patients prefer to call',
    },
    {
      key: 'booking',
      done: !!doctor.booking_url,
      label: 'Online booking link',
      why: 'Patients who can book online are more likely to show up',
    },
    {
      key: 'reviews',
      done: !!doctor.google_reviews_url,
      label: 'Google Reviews link',
      why: 'Reviews are the #1 trust signal',
    },
  ]

  const done = checks.filter(c => c.done).length
  const score = Math.round((done / checks.length) * 100)
  const missing = checks.filter(c => !c.done)

  return { checks, score, missing }
}

/**
 * Get the first nudge-eligible missing item.
 * Only items with nudgeSubject/nudgeBody are nudge-eligible (photo, bio, specialties).
 */
export function getNudgeTarget(doctor: Parameters<typeof getProfileCompleteness>[0]): CompletenessCheck | null {
  const { missing } = getProfileCompleteness(doctor)
  return missing.find(m => m.nudgeSubject) || null
}
