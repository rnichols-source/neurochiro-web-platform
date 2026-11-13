import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type PDFImage } from 'pdf-lib'

export type CarePdfExercise = {
  phase?: string
  name: string
  steps: string[]
}

export type CarePdfInput = {
  doctorName: string
  clinicName: string
  title: string
  objective?: string
  exercises: CarePdfExercise[]
  logoPng?: Uint8Array
}

const NAVY = rgb(30 / 255, 45 / 255, 59 / 255)
const ORANGE = rgb(214 / 255, 104 / 255, 41 / 255)
const INK = rgb(21 / 255, 32 / 255, 43 / 255)
const MUTED = rgb(91 / 255, 103 / 255, 115 / 255)
const PAGE_W = 612
const PAGE_H = 792
const MARGIN = 48

function winAnsi(value: string): string {
  const map: Record<string, string> = {
    '\u2013': '-',
    '\u2014': '-',
    '\u2018': "'",
    '\u2019': "'",
    '\u201C': '"',
    '\u201D': '"',
    '\u2026': '...',
  }
  return Array.from(value).map((char) => {
    if (map[char]) return map[char]
    const code = char.codePointAt(0) || 0
    if (code === 9 || code === 10 || code === 13) return ' '
    if (code >= 32 && code <= 126) return char
    if (code >= 160 && code <= 255) return char
    return '?'
  }).join('')
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const words = winAnsi(text).split(/\s+/).filter(Boolean)
  if (!words.length) return []
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (font.widthOfTextAtSize(next, size) <= width) {
      line = next
      continue
    }
    if (line) lines.push(line)
    line = word
  }
  if (line) lines.push(line)
  return lines
}

export async function careSetPdf(input: CarePdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  let logo: PDFImage | null = null
  if (input.logoPng?.length) {
    try { logo = await doc.embedPng(input.logoPng) } catch { logo = null }
  }

  const width = PAGE_W - MARGIN * 2
  let page = doc.addPage([PAGE_W, PAGE_H])
  let y = PAGE_H

  const footer = (target: PDFPage) => {
    target.drawText('neurochiro.co', { x: MARGIN, y: 28, size: 10, font, color: MUTED })
  }

  const header = () => {
    page.drawRectangle({ x: 0, y: PAGE_H - 72, width: PAGE_W, height: 72, color: NAVY })
    if (logo) {
      const scale = 28 / logo.height
      page.drawImage(logo, { x: MARGIN, y: PAGE_H - 50, width: logo.width * scale, height: 28 })
    } else {
      page.drawText('NeuroChiro', { x: MARGIN, y: PAGE_H - 42, size: 16, font: bold, color: rgb(1, 1, 1) })
    }
    page.drawRectangle({ x: 0, y: PAGE_H - 76, width: PAGE_W, height: 4, color: ORANGE })
    y = PAGE_H - 100
    footer(page)
  }

  const ensure = (needed: number) => {
    if (y - needed >= 56) return
    page = doc.addPage([PAGE_W, PAGE_H])
    header()
  }

  const drawLines = (lines: string[], size: number, used: PDFFont, color: ReturnType<typeof rgb>, gap = 4) => {
    for (const line of lines) {
      ensure(size + gap)
      page.drawText(line, { x: MARGIN, y, size, font: used, color })
      y -= size + gap
    }
  }

  header()
  const who = [input.doctorName, input.clinicName].map((part) => part.trim()).filter(Boolean).join(' · ')
  drawLines(wrap(who || 'Your NeuroChiro doctor', bold, 12, width), 12, bold, INK, 3)
  y -= 6
  drawLines(wrap(input.title || 'Care set', bold, 20, width), 20, bold, NAVY, 4)
  if (input.objective) {
    y -= 4
    drawLines(wrap(input.objective, font, 11, width), 11, font, MUTED, 3)
  }
  y -= 10

  let lastPhase = ''
  input.exercises.forEach((exercise, index) => {
    if (exercise.phase && exercise.phase !== lastPhase) {
      lastPhase = exercise.phase
      y -= 6
      drawLines(wrap(exercise.phase, bold, 13, width), 13, bold, ORANGE, 3)
      y -= 2
    }
    drawLines(wrap(`${index + 1}. ${exercise.name}`, bold, 12, width), 12, bold, INK, 3)
    for (const step of exercise.steps) {
      const lines = wrap(step, font, 11, width - 16)
      for (const line of lines) {
        ensure(15)
        page.drawText(line, { x: MARGIN + 16, y, size: 11, font, color: INK })
        y -= 15
      }
    }
    y -= 8
  })

  if (!input.exercises.length) drawLines(['This care set has no exercises yet.'], 12, font, INK)
  return doc.save()
}
