'use client'

import type { ReactNode } from 'react'

export function SlideOver({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[80]">
      <button type="button" className="absolute inset-0 bg-neuro-navy/40" aria-label="Close panel" onClick={onClose} />
      <aside className="absolute inset-0 overflow-y-auto bg-white p-4 shadow-2xl md:inset-y-0 md:left-auto md:right-0 md:w-[28rem]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-bold text-neuro-navy">{title}</h2>
          <button type="button" onClick={onClose} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-sm font-medium text-neuro-navy">
            Close
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </aside>
    </div>
  )
}
