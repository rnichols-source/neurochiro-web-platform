import Link from 'next/link'

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`mb-[11px] rounded-[18px] border border-[rgba(30,45,59,0.08)] bg-white px-[15px] pb-[15px] pt-[14px] shadow-[0_1px_2px_rgba(21,32,43,0.04)] ${className}`}>
      {children}
    </section>
  )
}

export function Kicker({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-[11.5px] font-semibold text-[#6b7785]">{children}</p>
}

export function BackHeading({ title, href = '/portal' }: { title: string; href?: string }) {
  return (
    <div className="mb-3 flex items-center gap-2 pt-2">
      <Link href={href} aria-label="Back to home" className="inline-flex h-9 w-9 items-center justify-center text-neuro-navy">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M15 5l-8 7 8 7" />
        </svg>
      </Link>
      <h1 className="font-heading text-[22px] font-bold tracking-[-0.03em] text-neuro-navy">{title}</h1>
    </div>
  )
}

export function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-[11px] bg-neuro-orange px-3 text-[13.5px] font-semibold text-white">
      {children}
    </Link>
  )
}

export function GhostLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-[11px] border border-[#d9dfe5] px-3 text-[13.5px] font-semibold text-neuro-navy">
      {children}
    </Link>
  )
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-[12px] font-semibold text-[#3d4a57]">{children}</label>
}

export const fieldClass = 'w-full rounded-[11px] border border-[#d9dfe5] bg-white px-3 py-2.5 text-[14px] text-[#16202a] outline-none focus:border-neuro-orange'

export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return <p className="rounded-[11px] bg-[#fdf1ea] px-3 py-2 text-[13px] text-[#B4501A]" role="alert">{message}</p>
}
