import type { Metadata } from 'next'
import { ShoppingList } from '@/components/community/shopping-list'
import { BackHeading } from '@/components/community/ui'
import { requireCommunityMember } from '@/lib/community/data'
import { loadRemedyAccount } from '@/lib/community/library-data'
import { remedyGuide } from '@/lib/community/library-content'
import { LIBRARY_COPY } from '@/lib/community/library-model'

export const metadata: Metadata = { title: 'Shopping list · Your NeuroChiro' }
export const dynamic = 'force-dynamic'

export default async function ShoppingPage() {
  const session = await requireCommunityMember()
  const guide = remedyGuide()
  const account = await loadRemedyAccount(session.userId)

  return (
    <div>
      <BackHeading title="Shopping list" href="/portal/care#remedies" label="Care" crumb="Care › Shopping list" area="care" />
      <p className="mb-2 text-[13.5px] leading-snug text-[#3d4a57]">{guide.shopping.intro}</p>
      <p className="mb-4 text-[13px] leading-snug text-[#3d4a57]">{LIBRARY_COPY.shoppingIntro}</p>
      {account.ready ? (
        <ShoppingList categories={guide.shopping.categories} checked={account.checks} />
      ) : (
        <ShoppingList categories={guide.shopping.categories} checked={[]} />
      )}
      {!account.ready ? <p className="mt-3 text-[13px] text-[#3d4a57]">{LIBRARY_COPY.almostReady}</p> : null}
    </div>
  )
}
