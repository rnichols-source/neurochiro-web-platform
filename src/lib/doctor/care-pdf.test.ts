import assert from 'node:assert/strict'
import test from 'node:test'
import { inflateSync } from 'node:zlib'
import { PDFDocument } from 'pdf-lib'
import { careSetPdf } from './care-pdf.ts'

function pdfText(bytes: Uint8Array): string {
  const raw = Buffer.from(bytes).toString('latin1')
  const chunks: Buffer[] = []
  let cursor = 0
  while (cursor < raw.length) {
    const start = raw.indexOf('stream', cursor)
    if (start < 0) break
    let dataStart = start + 'stream'.length
    if (raw[dataStart] === '\r') dataStart += 1
    if (raw[dataStart] === '\n') dataStart += 1
    const end = raw.indexOf('endstream', dataStart)
    if (end < 0) break
    let dataEnd = end
    if (raw[dataEnd - 1] === '\n') dataEnd -= 1
    if (raw[dataEnd - 1] === '\r') dataEnd -= 1
    const slice = Buffer.from(raw.slice(dataStart, dataEnd), 'latin1')
    try { chunks.push(inflateSync(slice)) } catch { chunks.push(slice) }
    cursor = end + 'endstream'.length
  }
  const content = Buffer.concat(chunks).toString('latin1')
  const literal = [...content.matchAll(/\((?:\\.|[^\\)])*\)/g)]
    .map((match) => match[0].slice(1, -1).replace(/\\([()\\])/g, '$1'))
  const hex = [...content.matchAll(/<([0-9A-Fa-f\s]+)>/g)].map((match) => {
    const clean = match[1].replace(/\s/g, '')
    let text = ''
    for (let i = 0; i + 1 < clean.length; i += 2) text += String.fromCharCode(parseInt(clean.slice(i, i + 2), 16))
    return text
  })
  return [...literal, ...hex].join('\n')
}

test('a care set PDF has the doctor, the exercises, and the site', async () => {
  const bytes = await careSetPdf({
    doctorName: 'Dr. José Marín',
    clinicName: 'Café Spine',
    title: 'Neck ease — week one',
    objective: 'A short plan for the first week.',
    exercises: [
      { phase: 'Week 1', name: 'Chin tuck', steps: ['Sit tall.', 'Draw the chin straight back and hold for five seconds.'] },
      { phase: 'Week 1', name: 'Shoulder blade squeeze', steps: ['Pinch the shoulder blades together without shrugging.'] },
      ...Array.from({ length: 18 }, (_, index) => ({
        phase: 'Week 2',
        name: `Movement ${index + 1}`,
        steps: ['Move slowly. Stop if it pinches. Breathe out as you return to the start and rest before the next one so the page has to wrap and continue onto another sheet.'],
      })),
    ],
  })
  assert.equal(Buffer.from(bytes.subarray(0, 5)).toString(), '%PDF-')
  const loaded = await PDFDocument.load(bytes)
  assert.ok(loaded.getPageCount() > 1)
  const text = pdfText(bytes)
  assert.match(text, /Jos. Mar.n/)
  assert.match(text, /Caf. Spine/)
  assert.match(text, /Neck ease/)
  assert.match(text, /Chin tuck/)
  assert.match(text, /Draw the chin straight back/)
  assert.match(text, /neurochiro\.co/)
})
