import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

async function fetchSeminars(userId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];

  const headers = { 'apikey': key, 'Authorization': `Bearer ${key}` };

  const [hostedRes, allRes] = await Promise.all([
    fetch(`${url}/rest/v1/seminars?host_id=eq.${userId}&is_past=eq.false&is_approved=eq.true&select=id,title,dates,city,country,location`, { headers }),
    fetch(`${url}/rest/v1/seminars?is_past=eq.false&is_approved=eq.true&host_id=not.eq.${userId}&select=id,title,dates,city,country,location,speakers`, { headers }),
  ]);

  const hosted = await hostedRes.json();
  const all = await allRes.json();

  const speakerEvents = (all || []).filter((e: any) => {
    if (!e.speakers) return false;
    return e.speakers.some((s: any) =>
      s.name?.toLowerCase().includes('raymond') || s.name?.toLowerCase().includes('nichols')
    );
  });

  const eventMap = new Map<string, any>();
  [...(hosted || []), ...speakerEvents].forEach((e: any) => eventMap.set(e.id, e));
  return Array.from(eventMap.values());
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || '5b3fd423-60a3-45f3-b3d3-cc39f84b3052';
  const title = searchParams.get('title') || 'WHERE TO FIND ME';
  const subtitle = searchParams.get('subtitle') || '2026 TOUR';
  const name = searchParams.get('name') || 'DR. RAYMOND NICHOLS';
  const handle = searchParams.get('handle') || '@neurochirodirectory';
  const format = searchParams.get('format') || 'square';

  const width = format === 'story' ? 1080 : format === 'landscape' ? 1200 : 1080;
  const height = format === 'story' ? 1920 : format === 'landscape' ? 630 : 1080;

  const rawEvents = await fetchSeminars(userId);

  const events = rawEvents.sort((a: any, b: any) => {
    // Extract month from dates string for rough sorting
    const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    const getMonth = (d: string) => {
      const lower = d.toLowerCase();
      for (let i = 0; i < months.length; i++) {
        if (lower.includes(months[i])) return i;
      }
      return 99;
    };
    return getMonth(a.dates) - getMonth(b.dates);
  });

  const locationLabel = (e: any) => {
    if (e.city && e.country) {
      if (e.country === 'United States') return e.city;
      if (e.country === 'United Kingdom') return `${e.city}, UK`;
      return `${e.city}, ${e.country}`;
    }
    return e.location || e.city || '';
  };

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#1E2D3B',
          padding: format === 'landscape' ? '40px 60px' : '60px',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background accent circles */}
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', backgroundColor: '#D66829', opacity: 0.08, display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '200px', height: '200px', borderRadius: '50%', backgroundColor: '#D66829', opacity: 0.05, display: 'flex' }} />

        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: format === 'landscape' ? '20px' : '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{ width: '40px', height: '3px', backgroundColor: '#D66829', display: 'flex' }} />
            <span style={{ color: '#D66829', fontSize: format === 'landscape' ? '14px' : '16px', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' as const }}>
              {subtitle}
            </span>
            <div style={{ width: '40px', height: '3px', backgroundColor: '#D66829', display: 'flex' }} />
          </div>
          <h1 style={{ color: 'white', fontSize: format === 'landscape' ? '36px' : '48px', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', textAlign: 'center' }}>
            {title}
          </h1>
        </div>

        {/* Event List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: format === 'landscape' ? '8px' : '12px', flex: 1, justifyContent: 'center' }}>
          {events.map((event, i) => (
            <div
              key={event.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: format === 'landscape' ? '10px 20px' : '16px 24px',
                borderRadius: '16px',
                backgroundColor: i === 0 ? 'rgba(214, 104, 41, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                border: i === 0 ? '2px solid rgba(214, 104, 41, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                gap: '16px',
              }}
            >
              {/* Date badge */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: format === 'landscape' ? '80px' : '100px',
                padding: '8px 12px',
                borderRadius: '12px',
                backgroundColor: i === 0 ? '#D66829' : 'rgba(255,255,255,0.08)',
              }}>
                <span style={{ color: 'white', fontSize: format === 'landscape' ? '11px' : '13px', fontWeight: 800, letterSpacing: '0.1em', textAlign: 'center', lineHeight: 1.3 }}>
                  {event.dates?.replace(/,?\s*\d{4}/, '').replace(' – ', '\n–\n').replace(' - ', '\n–\n')}
                </span>
              </div>

              {/* Event info */}
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <span style={{ color: 'white', fontSize: format === 'landscape' ? '16px' : '20px', fontWeight: 800, lineHeight: 1.2 }}>
                  {event.title.replace(' — ', '\n').split('\n')[0]}
                </span>
                {event.title.includes('—') && (
                  <span style={{ color: '#D66829', fontSize: format === 'landscape' ? '12px' : '14px', fontWeight: 700, marginTop: '2px' }}>
                    {event.title.split('—')[1]?.trim()}
                  </span>
                )}
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: format === 'landscape' ? '12px' : '14px', fontWeight: 600, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  📍 {locationLabel(event)}
                </span>
              </div>

              {/* Next badge for first event */}
              {i === 0 && (
                <div style={{
                  display: 'flex',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  backgroundColor: '#D66829',
                }}>
                  <span style={{ color: 'white', fontSize: '11px', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase' as const }}>NEXT</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: format === 'landscape' ? '16px' : '32px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: 'white', fontSize: format === 'landscape' ? '16px' : '20px', fontWeight: 900 }}>{name}</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', fontWeight: 600 }}>{handle}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#D66829', fontSize: format === 'landscape' ? '16px' : '20px', fontWeight: 900, letterSpacing: '-0.02em' }}>NEURO</span>
            <span style={{ color: 'white', fontSize: format === 'landscape' ? '16px' : '20px', fontWeight: 900, letterSpacing: '-0.02em' }}>CHIRO</span>
          </div>
        </div>
      </div>
    ),
    {
      width,
      height,
    }
  );
}
