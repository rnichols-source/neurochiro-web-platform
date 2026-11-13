'use client'

import { useLayoutEffect } from 'react'
import { useUserPreferences } from '@/context/UserPreferencesContext'

const EMPTY = { doctors: [], jobs: [], vendors: [], seminars: [], articles: [] }

export function SavedItemsSeed({ items }: { items: Record<string, unknown> | null }) {
  const { seedSaved } = useUserPreferences()
  useLayoutEffect(() => {
    if (!items) return
    seedSaved({
      doctors: stringList(items.doctors),
      jobs: stringList(items.jobs),
      vendors: stringList(items.vendors),
      seminars: stringList(items.seminars),
      articles: stringList(items.articles),
    })
  }, [items, seedSaved])
  return null
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return EMPTY.doctors
  return value.filter((item): item is string => typeof item === 'string')
}
