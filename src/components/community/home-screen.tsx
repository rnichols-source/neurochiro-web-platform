'use client'

import { useEffect, useState } from 'react'
import { HomeView, type HomeViewProps } from '@/components/community/home-view'
import { homeGreeting } from '@/lib/community/logic'

export function HomeScreen({ fullName, ...props }: Omit<HomeViewProps, 'greeting'> & { fullName: string | null }) {
  const [greeting, setGreeting] = useState(() => homeGreeting(new Date(), 'UTC', fullName))
  useEffect(() => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    setGreeting(homeGreeting(new Date(), zone, fullName))
  }, [fullName])
  return <HomeView {...props} greeting={greeting} />
}
