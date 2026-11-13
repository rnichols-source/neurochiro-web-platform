import type { Metadata } from 'next'
import Link from 'next/link'
import { IllnessNotes } from '@/components/community/illness-note'
import { BackHeading, Card, Kicker } from '@/components/community/ui'
import { requireCommunityMember } from '@/lib/community/data'
import { loadRemedyAccount } from '@/lib/community/library-data'
import { remedyGuide } from '@/lib/community/library-content'
import {
  LIBRARY_COPY,
  favoriteCards,
  remediesForSymptoms,
  remedyAnchor,
  searchRemedyCards,
  todayKey,
} from '@/lib/community/library-model'

export const metadata: Metadata = { title: 'Family remedies · Your NeuroChiro' }
export const dynamic = 'force-dynamic'

function listed(value: string | string[] | undefined): string[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

export default async function RemediesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; symptom?: string | string[] }>
}) {
  const session = await requireCommunityMember()
  const query = await searchParams
  const guide = remedyGuide()
  const account = await loadRemedyAccount(session.userId)
  const q = (query.q || '').trim()
  const symptoms = listed(query.symptom)
  const symptomHits = symptoms.length ? remediesForSymptoms(guide, symptoms) : []
  const searchHits = q.length >= 2 ? searchRemedyCards(guide, q) : []
  const hits = symptoms.length
    ? symptomHits.filter((hit) => searchHits.length === 0 || searchHits.some((item) => item.cardKey === hit.cardKey))
    : searchHits
  const saved = favoriteCards(guide, new Set(account.favorites))

  return (
    <div>
      <BackHeading title={LIBRARY_COPY.remediesTitle} href="/portal/care" />
      <p className="mb-3 text-[13.5px] leading-snug text-[#3d4a57]">{LIBRARY_COPY.remediesIntro}</p>
      <p className="mb-4 text-[13px] leading-snug text-[#3d4a57]">{guide.urgent}</p>
      <div className="mb-4 flex flex-wrap gap-3 text-[13px] font-semibold text-[#B4501A]">
        {guide.emergency.map((contact) => (
          <a key={contact.label} href={contact.phone === '911' ? 'tel:911' : 'tel:18002221222'}>
            {contact.label} {contact.phone}
          </a>
        ))}
      </div>

      <Card>
        <Kicker>{LIBRARY_COPY.symptomPrompt}</Kicker>
        <form method="get" className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {guide.symptoms.map((symptom) => (
              <label key={symptom.label} className="inline-flex min-h-11 items-center gap-1 rounded-full border border-[#d9dfe5] px-3 text-[13px] text-neuro-navy">
                <input type="checkbox" name="symptom" value={symptom.label} defaultChecked={symptoms.includes(symptom.label)} />
                {symptom.label}
              </label>
            ))}
          </div>
          <label className="block text-[12.5px] font-semibold text-[#3d4a57]">
            {LIBRARY_COPY.searchLabel}
            <input name="q" defaultValue={q} className="mt-1 min-h-11 w-full rounded-[11px] border border-[#d9dfe5] px-3 text-[14px] font-normal" />
          </label>
          <div className="flex gap-2">
            <button type="submit" className="min-h-11 rounded-[11px] bg-neuro-navy px-3 text-[13px] font-semibold text-white">{LIBRARY_COPY.showRemedies}</button>
            <Link href="/portal/care/remedies" className="inline-flex min-h-11 items-center rounded-[11px] border border-[#d9dfe5] px-3 text-[13px] font-semibold text-neuro-navy">{LIBRARY_COPY.clearSymptoms}</Link>
          </div>
        </form>
      </Card>

      {hits.length > 0 ? (
        <Card>
          <Kicker>Matches</Kicker>
          <ul className="space-y-2">
            {hits.map((hit) => (
              <li key={hit.cardKey}>
                <Link href={`/portal/care/remedies/${hit.sectionId}#${remedyAnchor(hit.cardKey)}`} className="text-[14px] font-semibold text-neuro-navy">
                  {hit.name}
                </Link>
                <p className="text-[12.5px] text-[#6b7785]">{hit.sectionTitle}</p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {saved.length > 0 ? (
        <Card>
          <Kicker>{LIBRARY_COPY.favorites}</Kicker>
          <ul className="space-y-2">
            {saved.map((hit) => (
              <li key={hit.cardKey}>
                <Link href={`/portal/care/remedies/${hit.sectionId}#${remedyAnchor(hit.cardKey)}`} className="text-[14px] font-semibold text-neuro-navy">{hit.name}</Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card>
        <Kicker>Sections</Kicker>
        <ul className="space-y-2">
          {guide.sections.map((section) => (
            <li key={section.id}>
              <Link href={`/portal/care/remedies/${section.id}`} className="text-[14px] font-semibold text-neuro-navy">{section.title}</Link>
            </li>
          ))}
          <li>
            <Link href="/portal/care/remedies/shopping" className="text-[14px] font-semibold text-neuro-navy">{guide.shopping.title}</Link>
          </li>
        </ul>
      </Card>

      <Card>
        <Kicker>{LIBRARY_COPY.illnessHeading}</Kicker>
        <p className="mb-2 text-[13px] leading-snug text-[#3d4a57]">{LIBRARY_COPY.illnessBody}</p>
        {account.ready ? <IllnessNotes notes={account.notes} today={todayKey(new Date())} /> : <p className="text-[13px] text-[#3d4a57]">{LIBRARY_COPY.almostReady}</p>}
      </Card>
    </div>
  )
}
