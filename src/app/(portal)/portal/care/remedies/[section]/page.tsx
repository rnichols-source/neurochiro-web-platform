import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { displayTitle } from '@/components/community/chrome'
import { RemedyFocus } from '@/components/community/remedy-focus'
import { requireCommunityMember } from '@/lib/community/data'
import { loadRemedyAccount } from '@/lib/community/library-data'
import { remedyGuide } from '@/lib/community/library-content'
import { LIBRARY_COPY, kidsStopCell, sectionById } from '@/lib/community/library-model'

export const metadata: Metadata = { title: 'Home remedy guide · Your NeuroChiro' }
export const dynamic = 'force-dynamic'

export default async function RemedySectionPage({ params }: { params: Promise<{ section: string }> }) {
  const session = await requireCommunityMember()
  const { section: sectionId } = await params
  const guide = remedyGuide()
  const section = sectionById(guide, sectionId)
  if (!section) notFound()
  const account = await loadRemedyAccount(session.userId)
  const title = displayTitle(section.title)

  return (
    <RemedyFocus
      title={title}
      crumb={`Care › Remedy guide › ${title}`}
      cards={section.cards}
      savedKeys={account.favorites}
    >
      {section.kidsTable ? (
        <div className="mt-4 overflow-x-auto rounded-[18px] border border-[#BFE3DD] bg-white">
          <p className="px-3 pt-3 text-[14px] leading-snug text-[#3d4a57]">{LIBRARY_COPY.kidsNote}</p>
          <table className="mt-2 w-full min-w-[640px] border-collapse text-left text-[14px]">
            <thead>
              <tr>
                {section.kidsTable.columns.map((column) => (
                  <th key={column} scope="col" className="border-b border-[#d9dfe5] px-3 py-2 font-semibold text-[#15202B]">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.kidsTable.rows.map((row) => (
                <tr key={row.remedy}>
                  <th scope="row" className="border-b border-[#d9dfe5] px-3 py-2 font-semibold text-[#15202B]">{row.remedy}</th>
                  {row.cells.map((cell, index) => (
                    <td key={`${row.remedy}-${index}`} className={`border-b border-[#d9dfe5] px-3 py-2 ${kidsStopCell(cell) ? 'font-semibold text-[#B3261E]' : 'text-[#15202B]'}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </RemedyFocus>
  )
}
