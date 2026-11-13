import Link from 'next/link'
import { BackHeading, Card } from '@/components/community/ui'

export function ComingView({
  title,
  kicker,
  body,
}: {
  title: string
  kicker: string
  body: string
}) {
  return (
    <div>
      <BackHeading title={title} />
      <Card>
        <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#6b7785]">{kicker}</p>
        <p className="text-[15px] leading-relaxed text-[#3d4a57]">{body}</p>
      </Card>
      <p className="mt-2 text-[13px] text-[#6b7785]">
        <Link href="/portal" className="font-semibold text-[#B4501A]">Back to home</Link>
      </p>
    </div>
  )
}
