'use client'

import { createContext, useContext, useRef } from 'react'

const ProfileSeedContext = createContext<Record<string, unknown> | null>(null)

export function ProfileSeed({ profile, children }: { profile: Record<string, unknown> | null; children: React.ReactNode }) {
  const value = useRef(profile)
  return <ProfileSeedContext.Provider value={value.current}>{children}</ProfileSeedContext.Provider>
}

export function useProfileSeed() {
  return useContext(ProfileSeedContext)
}
