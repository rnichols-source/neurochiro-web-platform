import Link from 'next/link'
import QueueClient from './QueueClient'
export const metadata = { title: 'Work Queue (Retired) | Coverage | NeuroChiro' }
export default function Page() {
  return (
    <>
      <div style={{ background: '#D66829', padding: '16px 24px', borderRadius: 8, margin: '0 0 24px', color: 'white', fontWeight: 700 }}>
        This page has been replaced by the Rapid Lookup station. <Link href="/admin/coverage/work" style={{ color: 'white', textDecoration: 'underline' }}>Go to /admin/coverage/work</Link>
      </div>
      <QueueClient />
    </>
  )
}
