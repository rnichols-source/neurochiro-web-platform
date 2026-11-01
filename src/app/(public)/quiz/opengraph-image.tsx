import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const runtime = 'nodejs'
export const alt = 'Find a nervous system chiropractor near you: 4-question match'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpenGraphImage() {
  const logo = await readFile(join(process.cwd(), 'public/logo-white.png'))
  const logoSrc = `data:image/png;base64,${logo.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#1E2D3B',
          color: 'white',
          padding: '72px',
        }}
      >
        <img src={logoSrc} alt="" width={88} height={88} />
        <div style={{ display: 'flex', marginTop: 36, fontSize: 56, fontWeight: 700, lineHeight: 1.15, maxWidth: 980 }}>
          Find a nervous system chiropractor near you
        </div>
        <div style={{ display: 'flex', marginTop: 24, fontSize: 28, color: '#F5F3EF' }}>
          4 quick questions. Free, no account needed.
        </div>
        <div style={{ display: 'flex', marginTop: 28, fontSize: 32, color: '#E8834A' }}>neurochiro.co</div>
      </div>
    ),
    { ...size },
  )
}
