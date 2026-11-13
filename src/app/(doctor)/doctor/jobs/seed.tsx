'use client'

import { createContext, useContext, useRef } from 'react'

type JobsSeedValue = { jobs: any[]; applications: any[] }

const JobsSeedContext = createContext<JobsSeedValue | null>(null)

export function JobsSeed({ jobs, applications, children }: { jobs: any[]; applications: any[]; children: React.ReactNode }) {
  const value = useRef({ jobs, applications })
  return <JobsSeedContext.Provider value={value.current}>{children}</JobsSeedContext.Provider>
}

export function useJobsSeed() {
  return useContext(JobsSeedContext)
}
