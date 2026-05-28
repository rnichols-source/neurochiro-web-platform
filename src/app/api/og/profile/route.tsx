import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

async function fetchDoctor(slug: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  const headers = { 'apikey': key, 'Authorization': `Bearer ${key}` };

  // Try slug first, then UUID
  let res = await fetch(
    `${url}/rest/v1/doctors?slug=eq.${slug}&verification_status=in.(verified,pending)&select=id,first_name,last_name,clinic_name,city,state,specialties,photo_url,membership_tier,is_founding_member,slug&limit=1`,
    { headers }
  );
  let data = await res.json();

  if (!data?.length) {
    res = await fetch(
      `${url}/rest/v1/doctors?id=eq.${slug}&verification_status=in.(verified,pending)&select=id,first_name,last_name,clinic_name,city,state,specialties,photo_url,membership_tier,is_founding_member,slug&limit=1`,
      { headers }
    );
    data = await res.json();
  }

  return data?.[0] || null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug') || '';
  const format = searchParams.get('format') || 'landscape';

  const doctor = await fetchDoctor(slug);
  if (!doctor) {
    return new Response('Doctor not found', { status: 404 });
  }

  const name = `Dr. ${doctor.first_name || ''} ${doctor.last_name || ''}`.trim();
  const location = [doctor.city, doctor.state].filter(Boolean).join(', ');
  const specialties = (doctor.specialties || []).slice(0, 3);
  const profileUrl = `neurochiro.co/directory/${doctor.slug || doctor.id}`;
  const isFounder = doctor.is_founding_member;

  // Dimensions by format
  const dims: Record<string, { w: number; h: number }> = {
    landscape: { w: 1200, h: 630 },
    post: { w: 1080, h: 1080 },
    story: { w: 1080, h: 1920 },
  };
  const { w: width, h: height } = dims[format] || dims.landscape;
  const isStory = format === 'story';
  const isPost = format === 'post';

  // Fetch photo as base64 if available
  let photoSrc: string | null = null;
  if (doctor.photo_url) {
    try {
      const photoRes = await fetch(doctor.photo_url);
      if (photoRes.ok) {
        const buffer = await photoRes.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const contentType = photoRes.headers.get('content-type') || 'image/jpeg';
        photoSrc = `data:${contentType};base64,${base64}`;
      }
    } catch {}
  }

  const photoSize = isStory ? 180 : isPost ? 160 : 120;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(165deg, #0a0f14 0%, #111a24 30%, #1a2744 60%, #0d1520 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background elements */}
        <div style={{ position: 'absolute', top: '-200px', right: '-150px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(214,104,41,0.12) 0%, transparent 70%)', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: '-100px', left: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)', display: 'flex' }} />

        {/* Top orange stripe */}
        <div style={{ position: 'absolute', top: '0', left: '0', right: '0', height: '4px', background: 'linear-gradient(90deg, transparent 0%, #D66829 30%, #e8864a 50%, #D66829 70%, transparent 100%)', display: 'flex' }} />

        {/* Dot pattern */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.03, backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px', display: 'flex' }} />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isStory ? '100px 60px' : isPost ? '80px 60px' : '40px 60px',
            position: 'relative',
            flex: 1,
            gap: isStory ? '28px' : '16px',
          }}
        >
          {/* Photo */}
          <div
            style={{
              width: `${photoSize}px`,
              height: `${photoSize}px`,
              borderRadius: '50%',
              border: '4px solid rgba(214,104,41,0.4)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#1E2D3B',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            }}
          >
            {photoSrc ? (
              <img src={photoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span
                style={{
                  color: '#D66829',
                  fontSize: `${photoSize * 0.4}px`,
                  fontWeight: 900,
                }}
              >
                {(doctor.first_name?.[0] || 'N').toUpperCase()}
              </span>
            )}
          </div>

          {/* Verified + Founding badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '20px',
                backgroundColor: 'rgba(59,130,246,0.15)',
                border: '1px solid rgba(59,130,246,0.3)',
              }}
            >
              <span style={{ color: '#60a5fa', fontSize: '12px', fontWeight: 800, letterSpacing: '0.1em' }}>
                VERIFIED
              </span>
            </div>
            {isFounder && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  backgroundColor: 'rgba(214,104,41,0.15)',
                  border: '1px solid rgba(214,104,41,0.3)',
                }}
              >
                <span style={{ fontSize: '11px' }}>⭐</span>
                <span style={{ color: '#D66829', fontSize: '12px', fontWeight: 800, letterSpacing: '0.1em' }}>
                  FOUNDING MEMBER
                </span>
              </div>
            )}
          </div>

          {/* Name */}
          <span
            style={{
              color: 'white',
              fontSize: isStory ? '52px' : isPost ? '48px' : '40px',
              fontWeight: 900,
              letterSpacing: '-0.02em',
              textAlign: 'center',
              lineHeight: 1.1,
            }}
          >
            {name}
          </span>

          {/* Clinic + Location */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <span
              style={{
                color: '#D66829',
                fontSize: isStory ? '18px' : '16px',
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                textAlign: 'center',
              }}
            >
              {doctor.clinic_name || 'Private Practice'}
            </span>
            {location && (
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', fontWeight: 600 }}>
                {location}
              </span>
            )}
          </div>

          {/* Specialty pills */}
          {specialties.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '8px' }}>
              {specialties.map((s: string, i: number) => (
                <div
                  key={i}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '20px',
                    backgroundColor: 'rgba(214,104,41,0.1)',
                    border: '1px solid rgba(214,104,41,0.25)',
                    display: 'flex',
                  }}
                >
                  <span style={{ color: '#D66829', fontSize: '13px', fontWeight: 700 }}>{s}</span>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <div
            style={{
              marginTop: isStory ? '32px' : '16px',
              padding: '12px 32px',
              borderRadius: '14px',
              backgroundColor: '#D66829',
              boxShadow: '0 8px 30px rgba(214,104,41,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ color: 'white', fontSize: '15px', fontWeight: 800, letterSpacing: '0.08em' }}>
              FIND ME ON NEUROCHIRO
            </span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 40px',
            width: '100%',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ color: '#D66829', fontSize: '20px', fontWeight: 900, letterSpacing: '-0.02em' }}>NEURO</span>
            <span style={{ color: 'white', fontSize: '20px', fontWeight: 900, letterSpacing: '-0.02em' }}>CHIRO</span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em' }}>
            {profileUrl}
          </span>
        </div>
      </div>
    ),
    { width, height }
  );
}
