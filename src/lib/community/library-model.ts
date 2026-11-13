/**
 * Pure rules for the NeuroChiro exercise library and family remedy guide.
 * Clinical text stays as written. This file does not load JSON and does not
 * calculate a medication dose.
 */

export const LIBRARY_CATEGORIES = [
  'spine',
  'neck',
  'shoulder',
  'hip',
  'knee',
  'hand',
  'head',
  'core',
  'posture',
  'prenatal',
  'lifestyle',
  'recovery',
] as const

export type LibraryCategory = (typeof LIBRARY_CATEGORIES)[number]

export const CATEGORY_LABELS: Record<LibraryCategory, string> = {
  spine: 'Spine',
  neck: 'Neck',
  shoulder: 'Shoulder',
  hip: 'Hip',
  knee: 'Knee',
  hand: 'Hand',
  head: 'Head',
  core: 'Core',
  posture: 'Posture',
  prenatal: 'Prenatal',
  lifestyle: 'Lifestyle',
  recovery: 'Recovery',
}

export const OMITTED_STUBS = [
  'sciatica',
  'sleep-position',
  'post-adjustment',
  'plantar-fasciitis',
  'carpal-tunnel',
  'scoliosis',
  'prenatal-trimester',
  'postpartum',
  'kids-posture',
  'seniors',
  'anti-inflammatory',
  'home-decompression',
  'driving-posture',
  'gym-safe',
] as const

export const LIBRARY_PLAN_COUNT = 28
export const LIBRARY_EXERCISE_COUNT = 423

export const FORBIDDEN_PUBLIC_PHRASES = [
  'AlignLife',
  'Align Life',
  '864-605-7544',
  'PelhamFalls@AlignLife.com',
  'PelhamFalls',
  'Dr. Raymond Nichols',
  'prescribed by Dr. Raymond',
  'Ask Dr. Ray',
  'Dr. Ray',
] as const

const BRAND_LINES: Record<string, string> = {
  'Bring your shoes to Dr. Ray for a wear-pattern check':
    'Bring your shoes to your NeuroChiro doctor for a wear-pattern check',
  "Cold exposure should never be painful or dangerous. Start with cool water, not ice. If you have a heart condition, blood pressure issues, or Raynaud's, talk to Dr. Ray before starting cold exposure.":
    "Cold exposure should never be painful or dangerous. Start with cool water, not ice. If you have a heart condition, blood pressure issues, or Raynaud's, talk to your NeuroChiro doctor before starting cold exposure.",
}

const BANNED_NOTE = /alignlife|864-605-7544|pelhamfalls|ask dr\. ray|dr\. raymond nichols/i

export function presentLibraryText(text: string): string {
  return BRAND_LINES[text] ?? text
}

export function forbiddenPhrase(text: string): string | null {
  return FORBIDDEN_PUBLIC_PHRASES.find((phrase) => text.includes(phrase)) ?? null
}

export const LIBRARY_COPY = {
  exercisesTitle: 'Your exercises',
  remediesTitle: 'Family remedies',
  origin: 'From the NeuroChiro library.',
  questions: 'Questions go to your NeuroChiro doctor. This is not a substitute for urgent care, and it is not a clinic file.',
  nothingAssigned: 'Nothing is assigned yet. Your doctor chooses a plan from the NeuroChiro library. You do not pick one for yourself.',
  remediesIntro: 'A family guide you can open any time. Open a section, or tap what is going on. It is not a diagnosis, and it is not a substitute for urgent care.',
  symptomPrompt: 'Tap what is going on',
  showRemedies: 'Show remedies',
  clearSymptoms: 'Clear',
  searchLabel: 'Search the guide',
  favorites: 'Favorites',
  shoppingTitle: 'Shopping list',
  shoppingIntro: 'Stock the house before you need it. Checks stay on your account.',
  kidsNote: 'This is the safety table from the family guide. It does not calculate a dose.',
  doctorLibrary: 'NeuroChiro library',
  doctorIntro: 'Browse the library, preview a plan, and assign it. You do not retype the exercises. A community member only sees plans you assign.',
  doctorPreview: 'The community member sees this plan as written. It is from the NeuroChiro library, assigned by you. It is not a clinic file.',
  assignPlan: 'Assign this plan',
  noteLabel: 'Optional note',
  noteHint: 'A short note for this community member. The plan text stays as it is written.',
  customSet: 'Or write a short set in your own words',
  customHint: 'One to eight steps, for something that is not in the library. A set is not a substitute for a visit.',
  sampleLabel: 'Sample · not care',
  sampleBody: 'This preview shows how a short set looks. It is not a plan from the library, and it is not care.',
  assignedSaved: 'Assigned. They will see it in Your NeuroChiro.',
  reminder: 'A gentle reminder on This week. No extra emails.',
  passport: 'Let a passport introduction include this title, only when you send one.',
  assignedByDoctor: 'Assigned by your doctor',
  lifestyleHeading: 'Lifestyle',
  maintenanceHeading: 'Weekly maintenance',
  doctorNoteHeading: 'Note from your doctor',
  illnessHeading: 'Your own note',
  illnessBody: 'A start date for when someone in the house feels off. It stays on this account. It is not sent to a clinic.',
  illnessSave: 'Save this note',
  saved: 'Saved',
  save: 'Save',
  careEmpty: 'The family remedy guide is in Care.',
  weekEmpty: 'Your doctor assigns exercise plans from the NeuroChiro library. The family remedy guide is here when you need it. Neither one is a visit.',
  careCard: 'Exercise plans your doctor assigns, and the family remedy guide.',
  almostReady: 'Assignments save with the latest database update. The family remedy guide is ready.',
  libraryReadyNote: 'Assigning a library plan saves with the latest database update.',
  alreadyAssigned: 'This plan is already assigned to that community member.',
  notHomeDoctor: 'That community member has not chosen you as their home doctor.',
} as const

export function assignedByLine(name: string | null | undefined): string {
  const clean = (name || '').trim()
  if (!clean || clean === 'Dr.') return LIBRARY_COPY.assignedByDoctor
  return `Assigned by ${clean}`
}

export function phaseProgressLabel(done: number, total: number): string {
  return `${done} of ${total} marked done`
}

export function careHomeLine(titles: string[]): string {
  const unique = [...new Set(titles.map((title) => title.trim()).filter(Boolean))]
  if (unique.length === 1) return `${unique[0]} is assigned. The family remedy guide is in Care.`
  if (unique.length > 1) return `${unique.length} exercise plans are assigned. The family remedy guide is in Care.`
  return LIBRARY_COPY.careEmpty
}

export type SourceExercise = { name: string; rx: string; description: string }
export type SourcePhase = {
  name: string
  badge: string
  week: string
  goal: string
  frequency: string
  focus: string
  exercises: SourceExercise[]
}
export type SourcePlan = {
  id: string
  name: string
  icon?: string
  category: string
  tags: string
  objective: string
  phases: SourcePhase[]
  lifestyle: string[]
  maintenance: string
}

export type LibraryExercise = { key: string; name: string; rx: string; description: string }
export type LibraryPhase = {
  key: string
  name: string
  badge: string
  week: string
  goal: string
  frequency: string
  focus: string
  exercises: LibraryExercise[]
}
export type LibraryPlan = {
  slug: string
  name: string
  category: LibraryCategory
  tags: string
  objective: string
  phases: LibraryPhase[]
  lifestyle: string[]
  maintenance: string
}

export function exerciseKey(slug: string, phaseIndex: number, exerciseIndex: number): string {
  return `${slug}:${phaseIndex}:${exerciseIndex}`
}

export function isLibraryCategory(value: string): value is LibraryCategory {
  return (LIBRARY_CATEGORIES as readonly string[]).includes(value)
}

export function presentPlans(source: SourcePlan[]): LibraryPlan[] {
  return source.map((plan) => {
    if (!isLibraryCategory(plan.category)) {
      throw new Error(`Unknown library category ${plan.category}`)
    }
    return {
      slug: plan.id,
      name: presentLibraryText(plan.name),
      category: plan.category,
      tags: plan.tags,
      objective: presentLibraryText(plan.objective),
      lifestyle: (plan.lifestyle || []).map(presentLibraryText),
      maintenance: presentLibraryText(plan.maintenance || ''),
      phases: plan.phases.map((phase, phaseIndex) => ({
        key: `${plan.id}:${phaseIndex}`,
        name: presentLibraryText(phase.name),
        badge: phase.badge,
        week: presentLibraryText(phase.week),
        goal: presentLibraryText(phase.goal),
        frequency: presentLibraryText(phase.frequency),
        focus: presentLibraryText(phase.focus),
        exercises: phase.exercises.map((exercise, exerciseIndex) => ({
          key: exerciseKey(plan.id, phaseIndex, exerciseIndex),
          name: presentLibraryText(exercise.name),
          rx: presentLibraryText(exercise.rx),
          description: presentLibraryText(exercise.description),
        })),
      })),
    }
  })
}

export function exerciseCount(plans: LibraryPlan[]): number {
  return plans.reduce((sum, plan) => sum + plan.phases.reduce((inner, phase) => inner + phase.exercises.length, 0), 0)
}

export function categoriesInUse(plans: LibraryPlan[]): LibraryCategory[] {
  const present = new Set(plans.map((plan) => plan.category))
  return LIBRARY_CATEGORIES.filter((category) => present.has(category))
}

export type LibrarySummary = {
  slug: string
  name: string
  category: LibraryCategory
  objective: string
  exerciseCount: number
  search: string
}

export function librarySummaries(plans: LibraryPlan[]): LibrarySummary[] {
  return plans.map((plan) => ({
    slug: plan.slug,
    name: plan.name,
    category: plan.category,
    objective: plan.objective,
    exerciseCount: plan.phases.reduce((sum, phase) => sum + phase.exercises.length, 0),
    search: `${plan.name} ${plan.category} ${plan.tags} ${plan.objective}`.toLowerCase(),
  }))
}

export function filterSummaries(summaries: LibrarySummary[], category: string, query: string): LibrarySummary[] {
  const q = query.trim().toLowerCase()
  return summaries.filter((plan) => {
    if (category && category !== 'all' && plan.category !== category) return false
    if (!q) return true
    return plan.search.includes(q) || plan.name.toLowerCase().includes(q)
  })
}

export function isAssignableSlug(plans: LibraryPlan[], slug: string): boolean {
  if ((OMITTED_STUBS as readonly string[]).includes(slug)) return false
  return plans.some((plan) => plan.slug === slug)
}

export function plansVisibleToMember(plans: LibraryPlan[], assignedSlugs: readonly string[]): LibraryPlan[] {
  const allowed = new Set(assignedSlugs)
  return plans.filter((plan) => allowed.has(plan.slug))
}

export function slugsForMember(
  rows: readonly { profileId: string; slug: string | null }[],
  profileId: string,
): string[] {
  const slugs: string[] = []
  for (const row of rows) {
    if (row.profileId !== profileId || !row.slug) continue
    if (!slugs.includes(row.slug)) slugs.push(row.slug)
  }
  return slugs
}

export function planBySlug(plans: LibraryPlan[], slug: string): LibraryPlan | null {
  return plans.find((plan) => plan.slug === slug) ?? null
}

export function planIncludesExercise(plan: LibraryPlan, key: string): boolean {
  return plan.phases.some((phase) => phase.exercises.some((exercise) => exercise.key === key))
}

export function planExerciseKeys(plan: LibraryPlan): string[] {
  return plan.phases.flatMap((phase) => phase.exercises.map((exercise) => exercise.key))
}

export function countDone(keys: readonly string[], done: ReadonlySet<string>): { finished: number; total: number } {
  return {
    total: keys.length,
    finished: keys.filter((key) => done.has(key)).length,
  }
}

export type AssignmentKind = 'library' | 'custom' | 'sample'

export function memberAssignmentRank(kind: AssignmentKind): number {
  if (kind === 'library') return 0
  if (kind === 'custom') return 1
  return 2
}

export function parseDoctorNote(note: string): { note: string | null } | { error: string } {
  const clean = note.trim().replace(/\s+/g, ' ')
  if (clean.length > 240) return { error: 'Keep the note to 240 characters.' }
  if (BANNED_NOTE.test(clean)) return { error: 'Leave clinic branding out of the note.' }
  return { note: clean || null }
}

export function todayKey(now: Date, timeZone = 'America/New_York'): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

export function parseIllnessNote(
  startedOn: string,
  note: string,
  today: string,
): { startedOn: string; note: string | null } | { error: string } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startedOn)) return { error: 'Choose the day it started.' }
  if (startedOn > today) return { error: 'That day is still ahead.' }
  const written = note.trim().replace(/\s+/g, ' ')
  if (written.length > 240) return { error: 'Keep the note to 240 characters.' }
  if (BANNED_NOTE.test(written)) return { error: 'Leave clinic branding out of the note.' }
  return { startedOn, note: written || null }
}

export function illnessDay(startedOn: string, today: string): number {
  const start = Date.parse(`${startedOn}T00:00:00Z`)
  const end = Date.parse(`${today}T00:00:00Z`)
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 1
  const days = Math.floor((end - start) / 86400000) + 1
  return days > 0 ? days : 1
}

export type RemedyBlock =
  | { type: 'label'; text: string }
  | { type: 'steps'; items: string[] }
  | { type: 'list'; items: string[] }
  | { type: 'note'; tone: 'plain' | 'timing' | 'warning' | 'tip'; text: string }

export type RemedyCard = {
  key: string
  name: string
  badges: string[]
  tagline: string
  search: string
  blocks: RemedyBlock[]
}

export type KidsTable = {
  columns: string[]
  rows: { remedy: string; cells: string[] }[]
}

export type RemedySection = {
  id: string
  title: string
  search: string
  cards: RemedyCard[]
  kidsTable: KidsTable | null
}

export type ShoppingCategory = {
  key: string
  title: string
  items: { key: string; label: string }[]
}

export type RemedyGuide = {
  calculator: 'excluded'
  symptoms: { label: string; keywords: string[] }[]
  urgent: string
  emergency: { label: string; phone: string }[]
  sections: RemedySection[]
  shopping: { title: string; intro: string; categories: ShoppingCategory[] }
}

export type RemedyHit = {
  sectionId: string
  sectionTitle: string
  cardKey: string
  name: string
}

export function remedyHaystack(card: RemedyCard): string {
  const parts = [card.search, card.name, card.tagline]
  for (const block of card.blocks) {
    if (block.type === 'steps' || block.type === 'list') parts.push(...block.items)
    else parts.push(block.text)
  }
  return parts.join(' ').toLowerCase()
}

export function remediesForSymptoms(guide: RemedyGuide, labels: readonly string[]): RemedyHit[] {
  const wanted = new Set(labels)
  const keywords = guide.symptoms
    .filter((symptom) => wanted.has(symptom.label))
    .flatMap((symptom) => symptom.keywords.map((keyword) => keyword.toLowerCase()))
  if (keywords.length === 0) return []
  return collectHits(guide, (card, sectionSearch) => {
    const haystack = remedyHaystack(card)
    return keywords.some((keyword) => haystack.includes(keyword) || sectionSearch.includes(keyword))
  })
}

export function searchRemedyCards(guide: RemedyGuide, query: string): RemedyHit[] {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []
  return collectHits(guide, (card, sectionSearch, sectionTitle) => {
    return remedyHaystack(card).includes(q) || sectionSearch.includes(q) || sectionTitle.includes(q)
  }).slice(0, 40)
}

function collectHits(
  guide: RemedyGuide,
  match: (card: RemedyCard, sectionSearch: string, sectionTitle: string) => boolean,
): RemedyHit[] {
  const hits: RemedyHit[] = []
  for (const section of guide.sections) {
    const sectionSearch = section.search.toLowerCase()
    const sectionTitle = section.title.toLowerCase()
    for (const card of guideCards(section)) {
      if (!match(card, sectionSearch, sectionTitle)) continue
      hits.push({
        sectionId: section.id,
        sectionTitle: section.title,
        cardKey: card.key,
        name: card.name,
      })
    }
  }
  return hits
}

function guideCards(section: RemedySection): RemedyCard[] {
  return section.cards
}

export function sectionById(guide: RemedyGuide, id: string): RemedySection | null {
  return guide.sections.find((section) => section.id === id) ?? null
}

export function remedyAnchor(key: string): string {
  return key.replace(/:/g, '-')
}

export function favoriteCards(guide: RemedyGuide, keys: ReadonlySet<string>): RemedyHit[] {
  const hits: RemedyHit[] = []
  for (const section of guide.sections) {
    for (const card of section.cards) {
      if (!keys.has(card.key)) continue
      hits.push({ sectionId: section.id, sectionTitle: section.title, cardKey: card.key, name: card.name })
    }
  }
  return hits
}

export function knownRemedyKey(guide: RemedyGuide, key: string): boolean {
  return guide.sections.some((section) => section.cards.some((card) => card.key === key))
}

export function knownShoppingKey(guide: RemedyGuide, key: string): boolean {
  return guide.shopping.categories.some((category) => category.items.some((item) => item.key === key))
}

export function kidsStopCell(value: string): boolean {
  return value === 'NEVER' || value === 'NO'
}

export function chromeBlob(): string {
  return [
    ...Object.values(LIBRARY_COPY),
    assignedByLine('Dr. Mina Cole'),
    assignedByLine(''),
    phaseProgressLabel(1, 4),
    careHomeLine([]),
    careHomeLine(['SI Joint Stability & Pelvic Rebalancing']),
    careHomeLine(['One', 'Two']),
    CATEGORY_LABELS.spine,
  ].join('\n')
}

export function presentedPlanBlob(plans: LibraryPlan[]): string {
  const parts: string[] = []
  for (const plan of plans) {
    parts.push(plan.name, plan.objective, plan.maintenance, ...plan.lifestyle)
    for (const phase of plan.phases) {
      parts.push(phase.name, phase.week, phase.goal, phase.frequency, phase.focus)
      for (const exercise of phase.exercises) parts.push(exercise.name, exercise.rx, exercise.description)
    }
  }
  return parts.join('\n')
}

export function guideBlob(guide: RemedyGuide): string {
  const parts: string[] = [guide.urgent, guide.shopping.title, guide.shopping.intro]
  for (const contact of guide.emergency) parts.push(contact.label, contact.phone)
  for (const symptom of guide.symptoms) parts.push(symptom.label)
  for (const section of guide.sections) {
    parts.push(section.title)
    if (section.kidsTable) {
      parts.push(...section.kidsTable.columns)
      for (const row of section.kidsTable.rows) parts.push(row.remedy, ...row.cells)
    }
    for (const card of section.cards) parts.push(card.name, card.tagline, ...card.badges, remedyHaystack(card))
  }
  for (const category of guide.shopping.categories) {
    parts.push(category.title)
    for (const item of category.items) parts.push(item.label)
  }
  return parts.join('\n')
}
