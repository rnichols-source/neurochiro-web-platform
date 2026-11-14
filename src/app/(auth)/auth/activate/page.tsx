'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase'
import { safeReturnPath } from '@/lib/auth/safe-return-path'

function Activate() {
  const params = useSearchParams()
  const [message, setMessage] = useState('Opening your portal...')
  useEffect(() => {
    const tokenHash = params.get('token_hash') || ''
    const type = params.get('type') === 'invite' ? 'invite' : 'magiclink'
    const next = safeReturnPath(params.get('next')) || '/doctor/dashboard'
    if (!tokenHash) {
      setMessage('This link is missing a token. Ask for a new one.')
      return
    }
    const supabase = createClient()
    void supabase.auth.verifyOtp({ token_hash: tokenHash, type }).then(({ error }) => {
      if (error) {
        setMessage('This link has expired. Use the newest email, or sign in if you already set a password.')
        return
      }
      window.location.assign(next)
    })
  }, [params])
  return <main className="mx-auto max-w-md px-4 py-16 text-[#15202B]"><h1 className="text-2xl font-bold">NeuroChiro</h1><p className="mt-3">{message}</p></main>
}

export default function ActivatePage() {
  return <Suspense fallback={<main className="px-4 py-16">Opening your portal...</main>}><Activate /></Suspense>
}
