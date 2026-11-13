'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toggleRemedyFavorite } from '@/lib/community/library-actions'
import { LIBRARY_COPY } from '@/lib/community/library-model'

export function FavoriteButton({ remedyKey, name, saved }: { remedyKey: string; name: string; saved: boolean }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  return (
    <div className="mt-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null)
          start(async () => {
            const result = await toggleRemedyFavorite(remedyKey, !saved)
            if (!result.ok) setError(result.error)
            else router.refresh()
          })
        }}
        aria-label={saved ? `Saved ${name}` : `Save ${name}`}
        className="min-h-11 rounded-[11px] border border-[#d9dfe5] px-3 text-[13px] font-semibold text-neuro-navy disabled:opacity-60"
      >
        {saved ? LIBRARY_COPY.saved : LIBRARY_COPY.save}
      </button>
      {error ? <p className="mt-1 text-[12.5px] text-[#B4501A]" role="alert">{error}</p> : null}
    </div>
  )
}
