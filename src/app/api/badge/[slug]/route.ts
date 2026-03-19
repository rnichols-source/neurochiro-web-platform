import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Optimized SVG Badge
  const svg = `
    <svg width="150" height="150" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="75" cy="75" r="70" fill="#0B1118" stroke="#D66829" stroke-width="4"/>
      <path d="M75 35L81.1226 47.4067L94.8176 49.4019L84.9088 59.0533L87.2475 72.6881L75 66.25L62.7525 72.6881L65.0912 59.0533L55.1824 49.4019L68.8774 47.4067L75 35Z" fill="#D66829"/>
      <text x="75" y="95" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-weight="900" font-size="12" style="text-transform:uppercase;letter-spacing:1px;">Verified</text>
      <text x="75" y="112" text-anchor="middle" fill="#D66829" font-family="Arial, sans-serif" font-weight="900" font-size="14" style="text-transform:uppercase;letter-spacing:2px;">Provider</text>
      <text x="75" y="130" text-anchor="middle" fill="#4B5563" font-family="Arial, sans-serif" font-weight="bold" font-size="8" style="text-transform:uppercase;letter-spacing:1px;">NeuroChiro.com</text>
      <path d="M100 75C100 88.8071 88.8071 100 75 100C61.1929 100 50 88.8071 50 75" stroke="#D66829" stroke-width="1" stroke-dasharray="2 2" opacity="0.3"/>
    </svg>
  `.trim();

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
