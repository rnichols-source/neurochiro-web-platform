import Link from 'next/link'
import WorkStationClient from './WorkStationClient'
export const metadata = { title: 'Reply Station (Retired) | Coverage | NeuroChiro' }
export default function Page() {
  return (
    <>
      <div style={{ background: '#D66829', padding: '16px 24px', borderRadius: 8, margin: '0 0 24px', color: 'white', fontWeight: 700 }}>
        This page has been replaced. The coverage map now includes all reply features. <Link href="/admin/coverage" style={{ color: 'white', textDecoration: 'underline' }}>Go to /admin/coverage</Link>
      </div>
      <WorkStationClient />
    </>
  )
}
