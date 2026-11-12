/**
 * Columns safe to return on a public doctor card once section E of the
 * lockdown migration is approved. Directory search still selects `phone`
 * until that section runs, because the card renders a tel: link.
 * This list is the target public set. It excludes email, phone, user_id,
 * stripe fields, license numbers, notes, and internal lead metrics.
 */
export const PUBLIC_DOCTOR_COLUMNS = [
  'id',
  'slug',
  'first_name',
  'last_name',
  'clinic_name',
  'city',
  'state',
  'country',
  'zip_code',
  'address',
  'latitude',
  'longitude',
  'instagram_url',
  'facebook_url',
  'website_url',
  'bio',
  'specialties',
  'rating',
  'review_count',
  'verification_status',
  'membership_tier',
  'is_hiring',
  'is_mentoring',
  'region_code',
  'photo_url',
  'video_url',
  'seo_keywords',
  'created_at',
  'updated_at',
  'profile_views',
  'is_founding_member',
  'accepting_new_patients',
  'offers_telehealth',
  'accepts_walkins',
  'languages',
  'hours',
  'booking_url',
  'listing_format',
  'co_owners',
] as const

export type PublicDoctorColumn = (typeof PUBLIC_DOCTOR_COLUMNS)[number]
