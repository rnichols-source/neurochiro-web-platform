import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Verify the doctor exists and has Growth+ tier
  const supabase = createAdminClient();
  const { data: doctor } = await supabase
    .from('doctors')
    .select('first_name, last_name, membership_tier, verification_status')
    .eq('slug', slug)
    .single();

  if (!doctor || doctor.verification_status !== 'verified') {
    return new NextResponse('Doctor not found', { status: 404 });
  }

  const isEligible = doctor.membership_tier === 'growth' || doctor.membership_tier === 'pro';
  const doctorName = `Dr. ${doctor.first_name} ${doctor.last_name}`;
  const tierLabel = doctor.membership_tier === 'pro' ? 'PRO' : 'VERIFIED';

  // Generate the SVG badge
  const badgeColor = doctor.membership_tier === 'pro' ? '#D66829' : '#3B82F6';

  const svg = `<svg width="200" height="60" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="60" rx="12" fill="#0B1118"/>
  <rect x="1" y="1" width="198" height="58" rx="11" stroke="${badgeColor}" stroke-width="2"/>
  ${isEligible ? `
  <circle cx="30" cy="30" r="16" fill="${badgeColor}" fill-opacity="0.15"/>
  <path d="M30 18L32.5 23.1L38.2 23.9L34.1 27.9L35 33.6L30 31L25 33.6L25.9 27.9L21.8 23.9L27.5 23.1L30 18Z" fill="${badgeColor}"/>
  <text x="52" y="27" fill="white" font-family="system-ui,-apple-system,sans-serif" font-weight="800" font-size="11" letter-spacing="0.5">${tierLabel} PROVIDER</text>
  <text x="52" y="43" fill="#9CA3AF" font-family="system-ui,-apple-system,sans-serif" font-weight="600" font-size="9" letter-spacing="0.3">NeuroChiro Directory</text>
  ` : `
  <circle cx="30" cy="30" r="16" fill="#374151" fill-opacity="0.3"/>
  <text x="52" y="27" fill="#6B7280" font-family="system-ui,-apple-system,sans-serif" font-weight="800" font-size="11" letter-spacing="0.5">LISTED PROVIDER</text>
  <text x="52" y="43" fill="#4B5563" font-family="system-ui,-apple-system,sans-serif" font-weight="600" font-size="9" letter-spacing="0.3">NeuroChiro Directory</text>
  `}
</svg>`.trim();

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
