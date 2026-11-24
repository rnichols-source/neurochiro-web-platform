'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { usePortal } from '@/components/portal/PortalProvider'
import { shouldShowLocationSwitcher } from '@/lib/portal/listings'
import { switchDoctorListing } from '@/app/(doctor)/doctor/listing-actions'

export function LocationSwitcher({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const ctx = usePortal()
  const router = useRouter()
  const listings = ctx.listings
  const selectedId = ctx.doctor?.id || listings[0]?.id || ''
  const [value, setValue] = useState(selectedId)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    setValue(selectedId)
  }, [selectedId])

  if (!shouldShowLocationSwitcher(listings.length) || !selectedId) return null

  const dark = variant === 'dark'
  return (
    <label className="block min-w-0 max-w-full">
      <span className="sr-only">Clinic location</span>
      <select
        data-location-switcher="true"
        aria-label="Clinic location"
        value={value}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.value
          if (!next || next === selectedId) return
          setValue(next)
          startTransition(async () => {
            const result = await switchDoctorListing(next)
            if (!result.ok) {
              setValue(selectedId)
              return
            }
            router.refresh()
          })
        }}
        className="dp-ui h-11 w-full max-w-full truncate rounded-xl border px-3 text-[14px] font-extrabold"
        style={dark
          ? { background: 'rgba(255,255,255,0.08)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }
          : { background: '#fff', color: '#15202B', borderColor: '#E7E2D8' }}
      >
        {listings.map((listing) => (
          <option key={listing.id} value={listing.id} style={{ color: '#15202B' }}>
            {listing.label}
          </option>
        ))}
      </select>
    </label>
  )
}
