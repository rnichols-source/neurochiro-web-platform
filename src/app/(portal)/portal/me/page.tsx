import type { Metadata } from 'next'
import { MeView, type MeRow } from '@/components/community/me-view'
import { AREAS } from '@/components/community/areas'
import { loadCommunitySnapshot, requireCommunityMember } from '@/lib/community/data'
import { displayFirstName, memberInitial } from '@/lib/community/logic'
import { loadExercises, loadOpenings, loadWorkInterests } from '@/lib/community/phase-data'
import { WORK_PATH_LABELS, parsePlace } from '@/lib/community/phases'

export const metadata: Metadata = { title: 'Me · Your NeuroChiro' }
export const dynamic = 'force-dynamic'

export default async function MePage() {
  const session = await requireCommunityMember()
  const [snapshot, exercises, work] = await Promise.all([
    loadCommunitySnapshot(session),
    loadExercises(session.userId),
    loadWorkInterests(session.userId),
  ])
  const name = displayFirstName(session.fullName) || 'Community member'
  const doctor = snapshot.homeDoctor
  const people = snapshot.family.map((person) => person.firstName).filter(Boolean)
  const open = work.interests.find((interest) => interest.status !== 'closed') || null
  const parsed = open ? parsePlace(open.place) : null
  const place = parsed && !('error' in parsed) ? parsed : null
  const openings = open ? await loadOpenings(open.path, place) : []
  const reminded = exercises.assignments.some((assignment) => assignment.reminder && !assignment.sample)
  const household: MeRow = {
    href: '/portal/family',
    title: 'Household',
    line: people.length ? people.join(', ') : 'Add the people in your household',
    icon: 'household',
    color: AREAS.home.color,
  }
  const homeDoctor: MeRow = {
    href: doctor ? '/portal/care' : '/portal/find',
    title: 'Home doctor',
    line: doctor ? `${doctor.title}${doctor.place ? ` · ${doctor.place.replace(/\s*· your home doctor$/, '')}` : ''}` : 'Choose a home doctor',
    icon: 'doctor',
    color: AREAS.care.color,
  }
  const privacy: MeRow = {
    href: '/portal/privacy',
    title: 'Privacy',
    line: 'You choose what doctors see',
    icon: 'privacy',
    color: '#1E2D3B',
  }
  const reminders: MeRow = {
    href: '/portal/week',
    title: 'Reminders',
    line: reminded ? 'Exercises · Thursday live' : 'In the app, when a plan is assigned',
    icon: 'reminders',
    color: AREAS.week.color,
  }
  const job: MeRow = {
    href: '/portal/work',
    title: 'Work in this field',
    line: open ? `You raised a hand for ${WORK_PATH_LABELS[open.path]}` : 'Raise your hand for CA and clinic jobs',
    icon: 'work',
    color: AREAS.refer.color,
    tag: openings.length ? `${openings.length} near you` : null,
  }
  return (
    <MeView
      name={name}
      initial={memberInitial(session.fullName)}
      email={session.email || ''}
      rows={{ people: [household, homeDoctor], settings: [privacy, reminders], work: job }}
    />
  )
}
