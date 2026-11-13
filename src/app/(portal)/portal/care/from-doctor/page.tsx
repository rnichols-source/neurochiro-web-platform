'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { claimCareSetInvite } from '@/lib/community/library-actions'

function Claim() {
  const token = useSearchParams().get('token') || ''
  const [message, setMessage] = useState(token ? 'Opening your care set…' : 'This link is missing a token.')
  const [ok, setOk] = useState(false)

  useEffect(() => {
    if (!token) return
    claimCareSetInvite(token).then((result) => {
      setOk(result.ok)
      setMessage(result.ok ? 'Your care set is waiting on your Care page.' : result.error)
    }).catch(() => setMessage('Sign in with the invited email, then open this link again.'))
  }, [token])

  return (
    <div className="rounded-[20px] bg-white p-5">
      <p className="text-[12px] font-extrabold tracking-[0.08em] text-[#0E857A]" style={{ textTransform: 'uppercase' }}>Care set</p>
      <p className="mt-2 text-[15px] text-[#15202B]">{message}</p>
      {ok ? <a href="/portal/care/exercises" className="mt-3 inline-flex min-h-11 items-center font-bold text-[#0E857A]">Open Care</a> : null}
    </div>
  )
}

export default function CareFromDoctorPage() {
  return (
    <Suspense fallback={<p className="text-[15px] text-[#5b6773]">Opening your care set…</p>}>
      <Claim />
    </Suspense>
  )
}
