function escapePdf(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

/** A simple branded text PDF. Standard Helvetica, no extra font files. */
export function careSetPdf(lines: string[]): Uint8Array {
  const pageLines = 42
  const pages: string[][] = []
  for (let i = 0; i < lines.length; i += pageLines) pages.push(lines.slice(i, i + pageLines))
  if (!pages.length) pages.push(['NeuroChiro care set'])
  const objects: string[] = []
  const pageIds: number[] = []
  objects.push('<< /Type /Catalog /Pages 2 0 R >>')
  const kidsPlaceholder = 1
  objects.push('')
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
  pages.forEach((page, index) => {
    const contentId = 4 + index * 2
    pageIds.push(contentId - 1)
    const commands = ['BT', '/F1 11 Tf', '50 780 Td', '14 TL']
    page.forEach((line, lineIndex) => {
      const text = escapePdf(line.slice(0, 110))
      commands.push(lineIndex === 0 ? `(${text}) Tj` : `T* (${text}) Tj`)
    })
    commands.push('ET')
    const stream = commands.join('\n')
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentId} 0 R /Resources << /Font << /F1 3 0 R >> >> >>`)
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`)
  })
  objects[kidsPlaceholder] = `<< /Type /Pages /Count ${pages.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] >>`
  let body = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(body.length)
    body += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xref = body.length
  body += `xref\n0 ${objects.length + 1}\n`
  body += '0000000000 65535 f \n'
  offsets.slice(1).forEach((offset) => {
    body += `${String(offset).padStart(10, '0')} 00000 n \n`
  })
  body += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return new TextEncoder().encode(body)
}
