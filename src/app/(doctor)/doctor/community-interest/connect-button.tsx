'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { connectWorkInterest } from '@/lib/community/phase-actions'

export function ConnectButton({ interestId }: { interestId: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        className="min-h-11 rounded-lg bg-neuro-orange px-3 text-sm font-bold text-white disabled:opacity-60"
        onClick={() => start(async () => {
          const result = await connectWorkInterest(interestId)
          if (!result.ok) {
            setError(result.error)
            return
          }
          router.refresh()
        })}
      >
        {pending ? 'Connecting…' : 'Connect'}
      </button>
      {error ? <p className="mt-2 text-sm text-neuro-orange">{error}</p> : null}
    </div>
  )
}
