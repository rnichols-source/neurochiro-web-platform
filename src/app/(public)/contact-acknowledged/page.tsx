import { createAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export default async function ContactAcknowledgedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; id?: string }>
}) {
  const { status, id } = await searchParams

  let patientName = ''
  let patientPhone = ''
  let patientNote = ''

  if (id && (status === 'success' || status === 'already')) {
    const supabase = createAdminClient()
    const { data } = await (supabase as any)
      .from('contact_requests')
      .select('name, phone, note')
      .eq('id', id)
      .single()
    if (data) {
      patientName = data.name
      patientPhone = data.phone
      patientNote = data.note || ''
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0B1118',
      padding: '24px',
      fontFamily: '-apple-system, system-ui, sans-serif',
    }}>
      <div style={{
        maxWidth: '420px',
        width: '100%',
        textAlign: 'center',
      }}>
        {status === 'success' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#10003;</div>
            <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
              Thank you
            </h1>
            <p style={{ color: '#9CA3AF', fontSize: '16px', marginBottom: '24px' }}>
              We have recorded that you are handling this request.
            </p>
            {patientName && (
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'left',
                marginBottom: '24px',
              }}>
                <p style={{ color: '#9CA3AF', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
                  Patient Details
                </p>
                <p style={{ color: 'white', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                  {patientName}
                </p>
                <p style={{ marginBottom: patientNote ? '8px' : '0' }}>
                  <a href={`tel:${patientPhone}`} style={{ color: '#D66829', fontSize: '18px', fontWeight: 700, textDecoration: 'none' }}>
                    {patientPhone}
                  </a>
                </p>
                {patientNote && (
                  <p style={{ color: '#9CA3AF', fontSize: '14px', marginTop: '8px' }}>
                    Note: {patientNote}
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {status === 'already' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#10003;</div>
            <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
              Already recorded
            </h1>
            <p style={{ color: '#9CA3AF', fontSize: '16px', marginBottom: '24px' }}>
              This request was already acknowledged. Here are the details again in case you need them.
            </p>
            {patientName && (
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'left',
              }}>
                <p style={{ color: 'white', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                  {patientName}
                </p>
                <p>
                  <a href={`tel:${patientPhone}`} style={{ color: '#D66829', fontSize: '18px', fontWeight: 700, textDecoration: 'none' }}>
                    {patientPhone}
                  </a>
                </p>
              </div>
            )}
          </>
        )}

        {status === 'expired' && (
          <>
            <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
              Link expired
            </h1>
            <p style={{ color: '#9CA3AF', fontSize: '16px' }}>
              This acknowledgment link has expired. Please log in to your dashboard or contact us.
            </p>
          </>
        )}

        {status === 'withdrawn' && (
          <>
            <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
              Request withdrawn
            </h1>
            <p style={{ color: '#9CA3AF', fontSize: '16px' }}>
              This patient withdrew their contact request. No action is needed.
            </p>
          </>
        )}

        {status === 'invalid' && (
          <>
            <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
              Invalid link
            </h1>
            <p style={{ color: '#9CA3AF', fontSize: '16px' }}>
              This link is not valid. If you received a contact request email, please use the button in that email.
            </p>
          </>
        )}

        {!status && (
          <>
            <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
              NeuroChiro
            </h1>
            <p style={{ color: '#9CA3AF', fontSize: '16px' }}>
              Nothing to show here.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
