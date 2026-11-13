import JobsBoard from './jobs-board'
import { getApplications, getJobPostings } from './actions'

export const dynamic = 'force-dynamic'

export default async function JobsPage() {
  const [jobs, applications] = await Promise.all([
    getJobPostings().catch(() => []),
    getApplications().catch(() => []),
  ])
  return <JobsBoard jobs={Array.isArray(jobs) ? jobs : []} applications={Array.isArray(applications) ? applications : []} />
}
