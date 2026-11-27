'use client'

import { useRouter } from 'next/navigation'

export function CouldNotLoad({ what }: { what: string }) {
  const router = useRouter()
  return (
    <div className="m-4 rounded-[22px] border border-dashed border-[#E9A77A] bg-white p-5 lg:mx-8">
      <p className="fd-ui text-[17px] font-extrabold">Could not load {what}</p>
      <p className="mt-1 text-[14px] text-[#5b6773]">This is not zero. The read failed, so nothing on this page is a count.</p>
      <button type="button" onClick={() => router.refresh()} className="fd-ui mt-3 inline-flex min-h-11 items-center rounded-xl bg-[#1E2D3B] px-4 font-extrabold text-white">Tap to retry</button>
    </div>
  )
}
