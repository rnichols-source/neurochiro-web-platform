'use client'

import { createContext, useContext, useMemo } from 'react'

type SettingsChrome = {
  email: string
  prefs: Record<string, boolean> | null
  blocked: { id: string; full_name: string }[]
}

const SettingsSeedContext = createContext<SettingsChrome | null>(null)

export function SettingsSeed({ email, prefs, blocked, children }: SettingsChrome & { children: React.ReactNode }) {
  const value = useMemo(() => ({ email, prefs, blocked }), [email, prefs, blocked])
  return <SettingsSeedContext.Provider value={value}>{children}</SettingsSeedContext.Provider>
}

export function useSettingsSeed() {
  return useContext(SettingsSeedContext)
}
