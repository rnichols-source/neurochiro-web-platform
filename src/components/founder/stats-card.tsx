'use client'

import { useRef } from 'react'

export function StatsCardView({
  dateLabel,
  followers,
  peopleUsed,
  approximate,
  countries,
  asks,
  doctorsLive,
  doctorCountries,
  visits,
  confirmedRate,
  visitPrice,
}: {
  dateLabel: string
  followers: number
  peopleUsed: number
  approximate: boolean
  countries: number | null
  asks: number | null
  doctorsLive: number | null
  doctorCountries: number | null
  visits: number | null
  confirmedRate: string | null
  visitPrice: string | null
}) {
  const ref = useRef<HTMLDivElement | null>(null)

  async function save() {
    const canvas = document.createElement('canvas')
    canvas.width = 1080
    canvas.height = 1600
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const gradient = ctx.createLinearGradient(0, 0, 1080, 1600)
    gradient.addColorStop(0, '#D66829')
    gradient.addColorStop(0.35, '#B4501A')
    gradient.addColorStop(0.75, '#1E2D3B')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 1080, 1600)
    ctx.fillStyle = '#fff'
    ctx.font = '700 42px Montserrat, sans-serif'
    ctx.fillText('NEUROCHIRO', 80, 160)
    ctx.font = '700 28px Montserrat, sans-serif'
    ctx.fillText(dateLabel, 80, 220)
    ctx.font = '800 120px Montserrat, sans-serif'
    ctx.fillText(followers.toLocaleString('en-US'), 80, 420)
    ctx.font = '600 36px Lato, sans-serif'
    ctx.fillText('followers · your figure', 80, 480)
    const cells = [
      [`${approximate ? '~' : ''}${peopleUsed.toLocaleString('en-US')}`, 'people used NeuroChiro'],
      [countries == null ? '—' : String(countries), 'countries asking'],
      [asks == null ? '—' : asks.toLocaleString('en-US'), 'people asked for a doctor'],
      [doctorsLive == null ? '—' : String(doctorsLive), `doctors live${doctorCountries ? ` · ${doctorCountries} countries` : ''}`],
      [visits == null ? '—' : String(visits), 'visit requests'],
      [confirmedRate || '—', 'confirmed contact'],
    ]
    cells.forEach((cell, index) => {
      const col = index % 2
      const row = Math.floor(index / 2)
      const x = 80 + col * 480
      const y = 620 + row * 220
      ctx.fillStyle = 'rgba(255,255,255,0.08)'
      roundRect(ctx, x, y, 440, 180, 28)
      ctx.fillStyle = '#fff'
      ctx.font = '800 64px Montserrat, sans-serif'
      ctx.fillText(cell[0], x + 28, y + 90)
      ctx.font = '500 28px Lato, sans-serif'
      ctx.fillText(cell[1], x + 28, y + 140)
    })
    ctx.font = '700 32px Montserrat, sans-serif'
    ctx.fillText(`$99 a month${visitPrice ? ` · ${visitPrice} median first visit` : ''}`, 80, 1480)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) return
    const file = new File([blob], 'neurochiro-numbers.png', { type: 'image/png' })
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'NeuroChiro numbers' }).catch(() => download(blob))
      return
    }
    download(blob)
  }

  return (
    <div className="mx-auto max-w-md px-4 py-4">
      <div ref={ref} className="overflow-hidden rounded-[32px] p-6 text-white" style={{ background: 'radial-gradient(120% 70% at 100% 0%, #D66829 0%, #B4501A 35%, #1E2D3B 75%)' }}>
        <div className="flex items-center justify-between">
          <p className="fd-ui text-[13px] font-black tracking-[0.12em]">NEUROCHIRO</p>
          <p className="text-[13px]">{dateLabel}</p>
        </div>
        <p className="fd-ui mt-6 text-[12px] font-extrabold uppercase tracking-[0.14em] text-white/80">The numbers</p>
        <p className="fd-ui text-[64px] font-extrabold leading-none">{followers.toLocaleString('en-US')}</p>
        <p className="text-[16px]">followers</p>
        <span className="fd-ui mt-1 inline-flex rounded-full bg-[#EFE5F5] px-2 py-0.5 text-[10px] font-extrabold uppercase text-[#5C3473]">Your figure</span>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Cell value={`${approximate ? '~' : ''}${peopleUsed.toLocaleString('en-US')}`} label="people used NeuroChiro" yours />
          <Cell value={countries == null ? '—' : String(countries)} label="countries asking for a doctor" />
          <Cell value={asks == null ? '—' : asks.toLocaleString('en-US')} label="people asked for a doctor" />
          <Cell value={doctorsLive == null ? '—' : String(doctorsLive)} label={`doctors live${doctorCountries ? ` · ${doctorCountries} countries` : ''}`} />
          <Cell value={visits == null ? '—' : String(visits)} label="visit requests" />
          <Cell value={confirmedRate || '—'} label="confirmed contact" />
        </div>
        <p className="fd-ui mt-4 text-[16px] font-bold">$99 a month{visitPrice ? ` · ${visitPrice} median first visit` : ''}</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button type="button" onClick={() => save()} className="fd-ui min-h-14 rounded-2xl bg-white text-[16px] font-extrabold text-[#D66829]">Share</button>
        <button type="button" onClick={() => save()} className="fd-ui min-h-14 rounded-2xl border border-white/40 text-[16px] font-extrabold text-white">Save image</button>
      </div>
      <p className="mt-3 text-center text-[12px] text-[#6b7785]">Followers and people who used NeuroChiro are your figures. Change them in Settings. Everything else is live.</p>
    </div>
  )
}

function Cell({ value, label, yours = false }: { value: string; label: string; yours?: boolean }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3">
      <b className="fd-ui block text-[28px] leading-none">{value}</b>
      <span className="mt-1 block text-[13px] text-white/90">{label}</span>
      {yours ? <span className="fd-ui mt-1 inline-flex rounded-full bg-[#EFE5F5] px-2 py-0.5 text-[10px] font-extrabold uppercase text-[#5C3473]">Your figure</span> : <span className="fd-ui mt-1 inline-flex rounded-full bg-[#DDF3E6] px-2 py-0.5 text-[10px] font-extrabold uppercase text-[#1E7A45]">Live data</span>}
    </div>
  )
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
  ctx.fill()
}

function download(blob: Blob) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'neurochiro-numbers.png'
  link.click()
  URL.revokeObjectURL(url)
}
