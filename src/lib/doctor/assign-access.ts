import 'server-only'

/** A doctor may recommend a plan to a home patient or anyone already in that doctor's pipeline. */
export async function doctorMayAssignProfile(admin: any, doctorId: string, profileId: string): Promise<boolean> {
  if (!doctorId || !profileId) return false
  const home = await admin.from('community_home_doctors').select('profile_id').eq('doctor_id', doctorId).eq('profile_id', profileId).maybeSingle()
  if (home.data?.profile_id) return true
  const visit = await admin.from('community_visit_requests').select('id').eq('doctor_id', doctorId).eq('profile_id', profileId).limit(1)
  if (!visit.error && visit.data?.length) return true
  const assigned = await admin.from('community_exercise_assignments').select('id').eq('doctor_id', doctorId).eq('profile_id', profileId).limit(1)
  if (!assigned.error && assigned.data?.length) return true
  return false
}
