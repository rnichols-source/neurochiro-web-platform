export type StudentProfileRow = {
  id: string
  full_name?: string | null
  chiropractic_school?: string | null
  school_name?: string | null
  graduation_year?: string | number | null
  areas_of_interest?: string[] | null
  practice_city?: string | null
  practice_state?: string | null
  current_year_in_school?: string | null
}

export type StudentVerificationRow = {
  id: string
  school_name?: string | null
  graduation_year?: number | null
  school_verified?: boolean | null
}

export type ListedStudent = {
  id: string
  userId: string
  name: string
  school: string
  graduationYear: number | null
  interests: string[]
  city: string
  state: string
  location: string
  detail: string
  bucket: 'mentoring' | 'shadowing' | 'associate' | 'other'
  schoolVerified: boolean
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function graduationYear(value: string | number | null | undefined): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const year = Math.trunc(value)
    return year >= 1950 && year <= 2100 ? year : null
  }
  const raw = text(value)
  if (!/^(19|20)\d{2}$/.test(raw)) return null
  return Number(raw)
}

export function studentInterests(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => text(item)).filter(Boolean)
}

export function studentBucket(interests: string[]): ListedStudent['bucket'] {
  const blob = interests.join(' ').toLowerCase()
  if (blob.includes('shadow')) return 'shadowing'
  if (blob.includes('associate')) return 'associate'
  if (blob.includes('mentor')) return 'mentoring'
  return 'other'
}

export function sameCity(practiceCity: string | null | undefined, doctorCity: string | null | undefined): boolean {
  const left = text(practiceCity).toLowerCase()
  const right = text(doctorCity).toLowerCase()
  return Boolean(left && right && left === right)
}

export function mapListedStudent(profile: StudentProfileRow, verification?: StudentVerificationRow | null): ListedStudent {
  const interests = studentInterests(profile.areas_of_interest)
  const school = text(profile.chiropractic_school) || text(profile.school_name) || text(verification?.school_name)
  const year = graduationYear(profile.graduation_year) ?? graduationYear(verification?.graduation_year)
  const city = text(profile.practice_city)
  const state = text(profile.practice_state)
  const yearInSchool = text(profile.current_year_in_school)
  const schoolVerified = verification?.school_verified === true
  const name = text(profile.full_name) || 'Student'
  const detail = [
    year ? `class of ${year}` : '',
    [city, state].filter(Boolean).join(', '),
    yearInSchool,
    schoolVerified ? 'School verified' : '',
  ].filter(Boolean).join(' · ')
  return {
    id: profile.id,
    userId: profile.id,
    name,
    school,
    graduationYear: year,
    interests,
    city,
    state,
    location: [city, state].filter(Boolean).join(', '),
    detail,
    bucket: studentBucket(interests),
    schoolVerified,
  }
}
