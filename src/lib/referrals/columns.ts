/**
 * Columns that exist on public.doctors.
 * subscription_status is not a doctors column. Selecting it makes PostgREST
 * reject the query, and the search then looks like there are no members.
 */
export const REFERRAL_DOCTOR_SELECT =
  'id, user_id, first_name, last_name, clinic_name, city, state, country, slug, photo_url, specialties, latitude, longitude, accepting_new_patients, membership_tier, is_founding_member, neuros_tier, created_at, verification_status';
