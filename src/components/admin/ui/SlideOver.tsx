'use client'

import { useEffect, useRef, type ReactNode, type RefObject } from 'react'

export function SlideOver({
  open,
  title,
  onClose,
  children,
  returnFocusRef,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  returnFocusRef?: RefObject<HTMLElement | null>
}) {
  const panelRef = useRef<HTMLElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    const preferred = returnFocusRef?.current ?? null
    previouslyFocused.current = preferred || (document.activeElement instanceof HTMLElement ? document.activeElement : null)
    const panel = panelRef.current
    const focusTarget = panel?.querySelector<HTMLElement>('[data-slideover-close]') || panel
    focusTarget?.focus()
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      const back = preferred || previouslyFocused.current
      back?.focus()
    }
  }, [open, onClose, returnFocusRef])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[80]">
      <button type="button" className="absolute inset-0 bg-neuro-navy/40" aria-label="Close panel" onClick={onClose} />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="absolute inset-0 overflow-y-auto bg-white p-4 shadow-2xl outline-none md:inset-y-0 md:left-auto md:right-0 md:w-[28rem]"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-bold text-neuro-navy">{title}</h2>
          <button type="button" data-slideover-close onClick={onClose} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-sm font-medium text-neuro-navy">
            Close
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </aside>
    </div>
  )
}
