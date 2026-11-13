'use client'

import { useEffect, useState } from 'react'
import { HomeView } from '@/components/community/home-view'
import { displayFirstName } from '@/lib/community/logic'
import { greeting } from '@/lib/portal/greeting'
import type { TodayFocus } from '@/lib/community/today'

export function HomeScreen({
  fullName,
  initial,
  focus,
}: {
  fullName: string | null
  initial: string
  focus: TodayFocus
}) {
  const name = displayFirstName(fullName)
  const [hello, setHello] = useState(() => greeting(new Date(), 'UTC'))
  useEffect(() => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    const next = greeting(new Date(), zone)
    const id = window.setTimeout(() => setHello(next), 0)
    return () => window.clearTimeout(id)
  }, [])
  return <HomeView greeting={hello} name={name} initial={initial} focus={focus} />
}
