'use client'

import { useEffect, useState } from 'react'
import { showCountdown } from '@/lib/community/phases'

export function ShowCountdown({ initial }: { initial: { days: number; hours: number; minutes: number } }) {
  const [value, setValue] = useState(initial)
  useEffect(() => {
    const tick = () => setValue(showCountdown(new Date()))
    const first = window.setTimeout(tick, 0)
    const id = window.setInterval(tick, 30000)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(id)
    }
  }, [])
  const cells = [
    { n: value.days, label: 'days' },
    { n: value.hours, label: 'hrs' },
    { n: value.minutes, label: 'min' },
  ]
  return (
    <div className="flex gap-2" aria-label={`${value.days} days, ${value.hours} hours, ${value.minutes} minutes`}>
      {cells.map((cell) => (
        <div key={cell.label} className="flex-1 rounded-xl bg-white/15 px-2 py-2 text-center">
          <b className="nc-ui block text-[22px] font-extrabold text-white">{cell.n}</b>
          <small className="text-[11px] text-white/90">{cell.label}</small>
        </div>
      ))}
    </div>
  )
}
