import { FavoriteButton } from '@/components/community/favorite-button'
import { remedyAnchor, type RemedyCard } from '@/lib/community/library-model'

export function RemedyCardView({ card, saved }: { card: RemedyCard; saved: boolean }) {
  return (
    <article id={remedyAnchor(card.key)} className="mb-[11px] scroll-mt-4 rounded-[18px] border border-[rgba(30,45,59,0.08)] bg-white px-[15px] py-[14px]">
      <h2 className="font-heading text-[16px] font-bold text-neuro-navy">
        {card.name}
        {card.badges.length > 0 ? <span className="ml-2 text-[12px] font-semibold text-[#B4501A]">{card.badges.join(' · ')}</span> : null}
      </h2>
      {card.tagline ? <p className="mt-1 text-[13.5px] leading-snug text-[#3d4a57]">{card.tagline}</p> : null}
      <div className="mt-3 space-y-3">
        {card.blocks.map((block, index) => {
          if (block.type === 'label') {
            return <h3 key={`${card.key}-label-${index}`} className="font-heading text-[14px] font-bold text-neuro-navy">{block.text}</h3>
          }
          if (block.type === 'steps') {
            return (
              <ol key={`${card.key}-steps-${index}`} className="list-decimal space-y-1 pl-5 text-[13.5px] leading-snug text-[#16202a]">
                {block.items.map((item, itemIndex) => <li key={`${index}-${itemIndex}`}>{item}</li>)}
              </ol>
            )
          }
          if (block.type === 'list') {
            return (
              <ul key={`${card.key}-list-${index}`} className="list-disc space-y-1 pl-5 text-[13.5px] leading-snug text-[#16202a]">
                {block.items.map((item, itemIndex) => <li key={`${index}-${itemIndex}`}>{item}</li>)}
              </ul>
            )
          }
          const tone = block.tone === 'warning'
            ? 'bg-[#fdf1ea] text-[#16202a]'
            : block.tone === 'tip' || block.tone === 'timing'
              ? 'bg-[#F5F3EF] text-[#16202a]'
              : 'text-[#3d4a57]'
          return (
            <p key={`${card.key}-note-${index}`} className={`rounded-2xl px-3 py-2 text-[13.5px] leading-snug ${tone}`}>{block.text}</p>
          )
        })}
      </div>
      <FavoriteButton remedyKey={card.key} name={card.name} saved={saved} />
    </article>
  )
}
