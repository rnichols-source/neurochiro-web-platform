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

const countryFlag: Record<string, string> = {
  'United States': '🇺🇸',
  'United Kingdom': '🇬🇧',
  'Australia': '🇦🇺',
  'Canada': '🇨🇦',
  'New Zealand': '🇳🇿',
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || '5b3fd423-60a3-45f3-b3d3-cc39f84b3052';
  const title = searchParams.get('title') || 'CATCH ME LIVE';
  const subtitle = searchParams.get('subtitle') || 'SPEAKING · EXHIBITING · CONNECTING';
  const name = searchParams.get('name') || 'DR. RAYMOND NICHOLS';
  const handle = searchParams.get('handle') || '@neurochirodirectory';
  const format = searchParams.get('format') || 'square';

  const width = format === 'story' ? 1080 : format === 'landscape' ? 1200 : 1080;
  const height = format === 'story' ? 1920 : format === 'landscape' ? 630 : 1080;

  const rawEvents = await fetchSeminars(userId);

  const events = rawEvents.sort((a: any, b: any) => {
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

  const extractShortDate = (dates: string) => {
    const months: Record<string, string> = { 'january':'JAN','february':'FEB','march':'MAR','april':'APR','may':'MAY','june':'JUN','july':'JUL','august':'AUG','september':'SEP','october':'OCT','november':'NOV','december':'DEC' };
    const lower = dates.toLowerCase();
    for (const [full, abbr] of Object.entries(months)) {
      if (lower.includes(full) || lower.includes(abbr.toLowerCase())) {
        const dayMatch = dates.match(/(\d{1,2})/);
        const day = dayMatch ? dayMatch[1] : '';
        return { month: abbr, day };
      }
    }
    return { month: '', day: '' };
  };

  const isSquare = format === 'square';
  const isStory = format === 'story';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(165deg, #0a0f14 0%, #111a24 30%, #1a2744 60%, #0d1520 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Dramatic background elements */}
        <div style={{ position: 'absolute', top: '-200px', right: '-150px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(214,104,41,0.12) 0%, transparent 70%)', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: '-100px', left: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)', display: 'flex' }} />
        <div style={{ position: 'absolute', top: '0', left: '0', right: '0', height: '3px', background: 'linear-gradient(90deg, transparent 0%, #D66829 30%, #e8864a 50%, #D66829 70%, transparent 100%)', display: 'flex' }} />

        {/* Dot pattern overlay */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.03, backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px', display: 'flex' }} />

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: isStory ? '80px 50px' : isSquare ? '50px' : '35px 50px', flex: 1, position: 'relative' }}>

          {/* Top: Name tag */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: isStory ? '40px' : '16px' }}>
            <div style={{ width: '4px', height: '36px', backgroundColor: '#D66829', borderRadius: '2px', display: 'flex' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: 'white', fontSize: isSquare ? '18px' : '15px', fontWeight: 900, letterSpacing: '0.08em' }}>{name}</span>
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em' }}>{handle}</span>
            </div>
          </div>

          {/* Title */}
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: isStory ? '50px' : isSquare ? '30px' : '16px' }}>
            <span style={{ color: '#D66829', fontSize: isSquare ? '13px' : '11px', fontWeight: 800, letterSpacing: '0.3em', marginBottom: '6px' }}>{subtitle}</span>
            <span style={{ color: 'white', fontSize: isStory ? '72px' : isSquare ? '58px' : '40px', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 0.95 }}>
              {title}
            </span>
            <div style={{ width: '80px', height: '4px', backgroundColor: '#D66829', borderRadius: '2px', marginTop: '16px', display: 'flex' }} />
          </div>

          {/* Events */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: isStory ? 'flex-start' : 'center', gap: isStory ? '16px' : isSquare ? '10px' : '6px' }}>
            {events.map((event, i) => {
              const { month, day } = extractShortDate(event.dates);
              const flag = countryFlag[event.country] || '📍';
              const isNext = i === 0;

              return (
                <div
                  key={event.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isSquare ? '16px' : '12px',
                    position: 'relative',
                  }}
                >
                  {/* Timeline dot + line */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20px' }}>
                    <div style={{
                      width: isNext ? '14px' : '8px',
                      height: isNext ? '14px' : '8px',
                      borderRadius: '50%',
                      backgroundColor: isNext ? '#D66829' : 'rgba(255,255,255,0.2)',
                      border: isNext ? '3px solid rgba(214,104,41,0.3)' : 'none',
                      display: 'flex',
                    }} />
                    {i < events.length - 1 && (
                      <div style={{ width: '1px', height: isStory ? '60px' : isSquare ? '44px' : '30px', backgroundColor: 'rgba(255,255,255,0.08)', display: 'flex', marginTop: '4px' }} />
                    )}
                  </div>

                  {/* Date */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: isSquare ? '60px' : '50px' }}>
                    <span style={{ color: isNext ? '#D66829' : 'rgba(255,255,255,0.6)', fontSize: isSquare ? '24px' : '20px', fontWeight: 900, lineHeight: 1 }}>{day}</span>
                    <span style={{ color: isNext ? '#D66829' : 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 800, letterSpacing: '0.15em' }}>{month}</span>
                  </div>

                  {/* Event card */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    padding: isSquare ? '14px 18px' : '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: isNext ? 'rgba(214,104,41,0.1)' : 'rgba(255,255,255,0.03)',
                    borderLeft: isNext ? '3px solid #D66829' : '3px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'white', fontSize: isSquare ? '18px' : '15px', fontWeight: 800, lineHeight: 1.2 }}>
                        {event.title.split('—')[0].split('–')[0].trim()}
                      </span>
                      {isNext && (
                        <span style={{ color: '#D66829', fontSize: '9px', fontWeight: 800, letterSpacing: '0.15em', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(214,104,41,0.15)', border: '1px solid rgba(214,104,41,0.3)' }}>NEXT UP</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <span style={{ fontSize: '14px' }}>{flag}</span>
                      <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: isSquare ? '13px' : '11px', fontWeight: 600 }}>
                        {locationLabel(event)}
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>·</span>
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: 600 }}>
                        {event.dates}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: isStory ? '40px' : '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ color: '#D66829', fontSize: isSquare ? '22px' : '18px', fontWeight: 900, letterSpacing: '-0.02em' }}>NEURO</span>
              <span style={{ color: 'white', fontSize: isSquare ? '22px' : '18px', fontWeight: 900, letterSpacing: '-0.02em' }}>CHIRO</span>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em' }}>NEUROCHIRO.CO</span>
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
