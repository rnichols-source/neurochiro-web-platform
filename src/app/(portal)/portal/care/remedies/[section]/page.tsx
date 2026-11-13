import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { RemedyCardView } from '@/components/community/remedy-card'
import { BackHeading } from '@/components/community/ui'
import { requireCommunityMember } from '@/lib/community/data'
import { loadRemedyAccount } from '@/lib/community/library-data'
import { remedyGuide } from '@/lib/community/library-content'
import { LIBRARY_COPY, kidsStopCell, sectionById } from '@/lib/community/library-model'

export const metadata: Metadata = { title: 'Family remedies · Your NeuroChiro' }
export const dynamic = 'force-dynamic'

export default async function RemedySectionPage({ params }: { params: Promise<{ section: string }> }) {
  const session = await requireCommunityMember()
  const { section: sectionId } = await params
  const guide = remedyGuide()
  const section = sectionById(guide, sectionId)
  if (!section) notFound()
  const account = await loadRemedyAccount(session.userId)
  const saved = new Set(account.favorites)

  return (
    <div>
      <BackHeading title={section.title} href="/portal/care/remedies" />
      <p className="mb-4 text-[13px] leading-snug text-[#3d4a57]">{LIBRARY_COPY.questions}</p>
      {section.kidsTable ? (
        <div className="mb-4 overflow-x-auto rounded-[18px] border border-[rgba(30,45,59,0.08)] bg-white">
          <p className="px-3 pt-3 text-[13px] leading-snug text-[#3d4a57]">{LIBRARY_COPY.kidsNote}</p>
          <table className="mt-2 w-full min-w-[640px] border-collapse text-left text-[13px]">
            <thead>
              <tr>
                {section.kidsTable.columns.map((column) => (
                  <th key={column} scope="col" className="border-b border-[#d9dfe5] px-3 py-2 font-semibold text-neuro-navy">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.kidsTable.rows.map((row) => (
                <tr key={row.remedy}>
                  <th scope="row" className="border-b border-[#d9dfe5] px-3 py-2 font-semibold text-neuro-navy">{row.remedy}</th>
                  {row.cells.map((cell, index) => (
                    <td key={`${row.remedy}-${index}`} className={`border-b border-[#d9dfe5] px-3 py-2 ${kidsStopCell(cell) ? 'font-semibold text-[#B4501A]' : 'text-[#16202a]'}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {section.cards.map((card) => (
        <RemedyCardView key={card.key} card={card} saved={saved.has(card.key)} />
      ))}
    </div>
  )
}
