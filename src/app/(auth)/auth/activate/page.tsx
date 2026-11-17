'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { loginPathWithReturn, safeReturnPath } from '@/lib/auth/safe-return-path'
import { finishListingClaim } from './claim'

function Activate() {
  const params = useSearchParams()
  const next = safeReturnPath(params.get('next')) || '/doctor/apply'
  const [message, setMessage] = useState('Opening your portal...')
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const tokenHash = params.get('token_hash') || ''
    const requested = params.get('type')
    const type = requested === 'invite' || requested === 'recovery' ? requested : 'magiclink'
    if (!tokenHash) {
      setFailed(true)
      setMessage('This link is missing a token. Ask for a new one.')
      return
    }
    const supabase = createClient()
    void supabase.auth.verifyOtp({ token_hash: tokenHash, type }).then(async ({ error }) => {
      if (error) {
        setFailed(true)
        setMessage('This link has expired. Use the newest email, or sign in if you already set a password.')
        return
      }
      await finishListingClaim().catch(() => undefined)
      window.location.assign(next)
    })
  }, [params, next])
  return (
    <main className="mx-auto max-w-md px-4 py-16 text-[#15202B]">
      <h1 className="text-2xl font-bold">NeuroChiro</h1>
      <p className="mt-3">{message}</p>
      {failed ? (
        <Link href={loginPathWithReturn(next)} className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-neuro-orange px-4 font-bold text-white">
          Log in to continue
        </Link>
      ) : null}
    </main>
  )
}

export default function ActivatePage() {
  return <Suspense fallback={<main className="px-4 py-16">Opening your portal...</main>}><Activate /></Suspense>
}
