'use client'

import { useState } from 'react'
import { dismissMemberReferralBanner } from '@/app/(doctor)/doctor/referral-actions'

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    return false
  }
}

function useCopied() {
  const [copied, setCopied] = useState(false)
  async function copy(value: string) {
    const ok = await copyText(value)
    if (!ok) return
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }
  return { copied, copy }
}

export function MemberReferralBanner({
  title,
  body,
  message,
}: {
  title: string
  body: string
  message: string
}) {
  const [hidden, setHidden] = useState(false)
  const { copied, copy } = useCopied()
  if (hidden) return null

  return (
    <div className="shrink-0 border-b border-portal-border bg-portal-accent-50 px-4 py-3">
      <div className="mx-auto flex max-w-6xl items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-portal-ink">{title}</p>
          <p className="mt-1 text-sm text-portal-ink-2">{body}</p>
          <button
            type="button"
            className="mt-2 min-h-11 rounded-lg bg-portal-accent px-4 text-sm font-bold text-white"
            onClick={() => { void copy(message) }}
          >
            {copied ? 'Copied' : 'Copy invite'}
          </button>
        </div>
        <button
          type="button"
          className="min-h-11 min-w-11 text-lg text-portal-ink-2"
          aria-label="Dismiss referral reminder"
          title="Dismiss"
          onClick={() => {
            setHidden(true)
            void dismissMemberReferralBanner()
          }}
        >
          ×
        </button>
      </div>
    </div>
  )
}

export function MemberInviteCard({
  url,
  message,
  explanation,
  countLabel,
}: {
  url: string
  message: string
  explanation: string
  countLabel: string
}) {
  const { copied, copy } = useCopied()
  return (
    <section className="bg-white border border-portal-border rounded-xl p-4">
      <h2 className="text-lg font-bold text-portal-ink">Invite a colleague</h2>
      <p className="mt-1 text-sm text-portal-ink-2">{explanation}</p>
      <p className="mt-2 text-sm font-bold text-portal-ink">{countLabel}</p>
      <p className="mt-3 text-sm text-portal-ink-2 break-all">{url}</p>
      <button
        type="button"
        className="mt-3 min-h-11 w-full sm:w-auto px-4 rounded-lg bg-portal-accent text-white text-sm font-bold"
        onClick={() => { void copy(message) }}
      >
        {copied ? 'Copied' : 'Copy invite'}
      </button>
    </section>
  )
}
