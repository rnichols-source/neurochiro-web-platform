'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { skipProfileStep } from '@/app/(doctor)/doctor/home-actions'

export function SkipProfileButton() {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => {
        await skipProfileStep()
        router.refresh()
      })}
      className="dp-ui inline-flex h-[52px] items-center justify-center rounded-2xl border border-[#E3D6C8] bg-white px-5 text-[16px] font-extrabold text-[#3d4a57] disabled:opacity-60"
    >
      {pending ? 'Skipping…' : 'Skip for now'}
    </button>
  )
}
