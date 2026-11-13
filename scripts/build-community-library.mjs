/**
 * Builds the committed library JSON from the source uploads.
 * Run only when the source files are on disk. The app reads the JSON output.
 *
 *   node scripts/build-community-library.mjs <exercise-json> <remedy-json> <remedy-html>
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const [exercisePath, remedyPath, htmlPath] = process.argv.slice(2)
if (!exercisePath || !remedyPath || !htmlPath) {
  console.error('usage: node scripts/build-community-library.mjs <exercise-json> <remedy-json> <remedy-html>')
  process.exit(1)
}

const exercise = JSON.parse(readFileSync(exercisePath, 'utf8'))
const remedy = JSON.parse(readFileSync(remedyPath, 'utf8'))
const html = readFileSync(htmlPath, 'utf8')

const OMITTED = [
  'sciatica', 'sleep-position', 'post-adjustment', 'plantar-fasciitis', 'carpal-tunnel',
  'scoliosis', 'prenatal-trimester', 'postpartum', 'kids-posture', 'seniors',
  'anti-inflammatory', 'home-decompression', 'driving-posture', 'gym-safe',
]

function decode(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
}

function textOf(fragment) {
  return decode(fragment
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h3|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, ''))
    .replace(/\u00a0/g, ' ')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
    .trim()
}

function extractDivs(source, className) {
  const needle = `<div class="${className}"`
  const found = []
  let from = 0
  while (from < source.length) {
    const start = source.indexOf(needle, from)
    if (start === -1) break
    const openEnd = source.indexOf('>', start)
    if (openEnd === -1) break
    const attrs = source.slice(start + needle.length, openEnd)
    let depth = 1
    let i = openEnd + 1
    while (i < source.length && depth > 0) {
      const nextOpen = source.indexOf('<div', i)
      const nextClose = source.indexOf('</div>', i)
      if (nextClose === -1) break
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth += 1
        i = nextOpen + 4
      } else {
        depth -= 1
        if (depth === 0) {
          found.push({ attrs, inner: source.slice(openEnd + 1, nextClose), start })
        }
        i = nextClose + 6
      }
    }
    from = i
  }
  return found
}

function attr(attrs, name) {
  const match = attrs.match(new RegExp(`${name}="([^"]*)"`))
  return match ? decode(match[1]) : ''
}

function listItems(inner) {
  return [...inner.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((match) => textOf(match[1]))
}

function parseBlocks(inner) {
  const blocks = []
  const re = /<div class="remedy-section-label">([\s\S]*?)<\/div>|<ol class="steps">([\s\S]*?)<\/ol>|<ul class="(?:ingredient-list|shop-list)">([\s\S]*?)<\/ul>|<div class="(warning-box|timing-box|pro-tip)">([\s\S]*?)<\/div>|<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/g
  let match
  while ((match = re.exec(inner))) {
    if (match[1] != null) blocks.push({ type: 'label', text: textOf(match[1]) })
    else if (match[2] != null) blocks.push({ type: 'steps', items: listItems(match[2]) })
    else if (match[3] != null) blocks.push({ type: 'list', items: listItems(match[3]) })
    else if (match[4] != null) {
      const tone = match[4] === 'warning-box' ? 'warning' : match[4] === 'pro-tip' ? 'tip' : 'timing'
      blocks.push({ type: 'note', tone, text: textOf(match[5]).replace(/\n+/g, ' ') })
    } else if (match[6] != null) {
      const text = textOf(match[6]).replace(/\n+/g, ' ')
      if (text) blocks.push({ type: 'note', tone: 'plain', text })
    }
  }
  return blocks
}

function slugPart(value) {
  return value.toLowerCase().replace(/&amp;/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 72)
}

function cardKey(sectionId, name, used) {
  const base = `${sectionId}:${slugPart(name) || 'card'}`
  let key = base
  let n = 2
  while (used.has(key)) {
    key = `${base}-${n}`
    n += 1
  }
  used.add(key)
  return key
}

function jsonCard(sectionId, card, used) {
  return {
    key: cardKey(sectionId, card.name, used),
    name: card.name,
    badges: card.badges || [],
    tagline: card.tagline || '',
    search: card.search || '',
    blocks: (card.parts || []).map((part) => {
      if (part.type === 'label') return { type: 'label', text: part.text }
      if (part.type === 'steps') return { type: 'steps', items: part.items }
      if (part.type === 'list') return { type: 'list', items: part.items }
      if (part.type === 'tip') return { type: 'note', tone: 'tip', text: part.text }
      const tone = part.class === 'warning-box' ? 'warning' : part.class === 'timing-box' ? 'timing' : 'plain'
      return { type: 'note', tone, text: part.text }
    }).filter((block) => {
      if (block.type === 'note' && block.tone === 'plain' && block.text.startsWith('Swipe to see all ages')) return false
      return true
    }),
  }
}

function htmlCard(sectionId, card, used) {
  const nameHtml = (card.inner.match(/<div class="(?:remedy|eo)-name">([\s\S]*?)<\/div>/) || [, ''])[1]
  const badges = [...nameHtml.matchAll(/<span class="badge[^"]*">([^<]*)<\/span>/g)].map((match) => textOf(match[1]))
  const name = textOf(nameHtml.replace(/<span class="badge[\s\S]*?<\/span>/g, ''))
  const taglineHtml = card.inner.match(/<div class="(?:remedy-tagline|eo-uses)">([\s\S]*?)<\/div>/)
  const how = card.inner.match(/<div class="eo-how">([\s\S]*?)<\/div>/)
  const blocks = parseBlocks(card.inner)
  if (how) {
    const lines = textOf(how[1]).split('\n').map((line) => line.trim()).filter(Boolean)
    if (lines.length) blocks.push({ type: 'list', items: lines })
  }
  const title = card.inner.match(/<h3>([\s\S]*?)<\/h3>/)
  const resolvedName = name || (title ? textOf(title[1]) : 'Card')
  return {
    key: cardKey(sectionId, resolvedName, used),
    name: resolvedName,
    badges,
    tagline: taglineHtml ? textOf(taglineHtml[1]).replace(/\n+/g, ' ') : '',
    search: attr(card.attrs, 'data-search'),
    blocks,
  }
}

function sectionSlice(id, nextIds) {
  const start = html.indexOf(`id="${id}"`)
  if (start < 0) throw new Error(`missing section ${id}`)
  let end = html.length
  for (const next of nextIds) {
    const at = html.indexOf(`id="${next}"`, start + 8)
    if (at > start && at < end) end = at
  }
  return html.slice(start, end)
}

function sectionSearch(id) {
  const at = html.indexOf(`id="${id}"`)
  const window = html.slice(at, at + 280)
  const match = window.match(/data-search="([^"]*)"/)
  return match ? decode(match[1]) : ''
}

function sectionTitle(id, fallback) {
  const slice = sectionSlice(id, [])
  const match = slice.match(/<span class="section-title">([\s\S]*?)<\/span>|<h2>([\s\S]*?)<\/h2>/)
  return textOf((match && (match[1] || match[2])) || fallback)
}

const sectionOrder = [
  'first-response', 'sore-throat', 'congestion', 'fever', 'cough', 'energy', 'stomach', 'nausea',
  'kidney-stones', 'immune', 'headache', 'ear', 'sleep', 'skin', 'body-aches', 'allergies',
  'bites-stings', 'mouth-teeth', 'eyes', 'nose', 'digestion', 'uti', 'heartburn', 'anxiety',
  'menstrual', 'sunburn', 'motion-sick', 'lice', 'ringworm', 'croup', 'hfm', 'misc-quick',
  'swimmers-ear', 'skin-hair', 'womens', 'back-neck', 'eyes-screens', 'vertigo', 'snoring',
  'poison-plants', 'baby', 'drinks', 'disinfect', 'stay-healthy', 'my-protocol', 'total-health',
  'essential-oils', 'protocols', 'kids',
]

const jsonById = new Map(remedy.sections.map((section) => [section.id, section]))
const sections = []

for (const id of sectionOrder) {
  const used = new Set()
  const source = jsonById.get(id)
  let cards = []
  if (id === 'misc-quick' || id === 'protocols') {
    const slice = sectionSlice(id, sectionOrder)
    const kind = id === 'protocols' ? 'protocol-card' : 'remedy-card'
    cards = extractDivs(slice, kind).map((card) => htmlCard(id, card, used))
  } else if (source) {
    cards = source.cards.map((card) => jsonCard(id, card, used))
    if (id === 'my-protocol') {
      const slice = sectionSlice(id, sectionOrder)
      const protocols = extractDivs(slice, 'protocol-card').map((card) => htmlCard(id, card, used))
      const wallet = cards.pop()
      cards = [...cards, ...protocols]
      if (wallet) cards.push(wallet)
    }
    if (id === 'essential-oils') {
      const slice = sectionSlice(id, sectionOrder)
      cards.push(...extractDivs(slice, 'eo-card').map((card) => htmlCard(id, card, used)))
    }
  }
  const title = id === 'my-protocol'
    ? 'My Protocol: Pick Your Level'
    : id === 'protocols'
      ? sectionTitle(id, 'Daily Protocols')
      : (source?.title || sectionTitle(id, id))
  sections.push({
    id,
    title,
    search: sectionSearch(id),
    cards,
    kidsTable: null,
  })
}

const kids = sections.find((section) => section.id === 'kids')
const kidsSlice = sectionSlice('kids', ['shopping'])
const table = kidsSlice.match(/<table class="age-table">([\s\S]*?)<\/table>/)
if (!table) throw new Error('kids table missing')
const rows = [...table[1].matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((row) =>
  [...row[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((cell) => textOf(cell[1])),
)
kids.kidsTable = {
  columns: rows[0],
  rows: rows.slice(1).map((cells) => ({ remedy: cells[0], cells: cells.slice(1) })),
}

const shopSlice = sectionSlice('shopping', ['toast'])
const shopping = {
  title: sectionTitle('shopping', 'The Complete Shopping List'),
  intro: textOf((shopSlice.match(/<p class="sub">([\s\S]*?)<\/p>/) || [, ''])[1]),
  categories: extractDivs(shopSlice, 'shop-category').map((category, index) => {
    const title = textOf((category.inner.match(/<h3>([\s\S]*?)<\/h3>/) || [, ''])[1])
    const items = listItems(category.inner).map((label, itemIndex) => ({
      key: `${slugPart(title) || 'list'}:${itemIndex}`,
      label,
    }))
    return { key: slugPart(title) || `list-${index}`, title, items }
  }),
}

const symptoms = [...html.matchAll(/<span class="symptom-pill" data-symptom="([^"]*)">([^<]*)<\/span>/g)].map((match) => ({
  label: decode(match[2]),
  keywords: decode(match[1]).split(' ').filter(Boolean),
}))

const urgent = textOf((html.match(/<div class="urgent-banner">([\s\S]*?)<\/div>/) || [, ''])[1]).replace(/\n+/g, ' ')

const guide = {
  calculator: 'excluded',
  symptoms,
  urgent,
  emergency: [
    { label: 'Poison Control', phone: '1-800-222-1222' },
    { label: '911', phone: '911' },
  ],
  sections,
  shopping,
}

const plans = {
  omittedStubs: exercise.omitted_stubs || OMITTED,
  plans: exercise.plans,
}

const outDir = join(root, 'src/lib/community/library')
mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'plans.json'), JSON.stringify(plans))
writeFileSync(join(outDir, 'guide.json'), JSON.stringify(guide))

let exercises = 0
for (const plan of plans.plans) {
  for (const phase of plan.phases) exercises += phase.exercises.length
}
const cards = sections.reduce((sum, section) => sum + section.cards.length, 0)
const shopItems = shopping.categories.reduce((sum, category) => sum + category.items.length, 0)
const blob = JSON.stringify(guide)
for (const banned of ['doseWeight', 'Kid Dosage Calculator', '0.453592', 'AlignLife', '864-605-7544', 'PelhamFalls']) {
  if (blob.includes(banned)) throw new Error(`guide contains ${banned}`)
}
console.log(JSON.stringify({
  plans: plans.plans.length,
  exercises,
  sections: sections.length,
  cards,
  symptoms: symptoms.length,
  shopCategories: shopping.categories.length,
  shopItems,
  kidsRows: kids.kidsTable.rows.length,
  protocols: sections.find((section) => section.id === 'protocols').cards.map((card) => card.name),
  myProtocol: sections.find((section) => section.id === 'my-protocol').cards.map((card) => card.name),
}, null, 2))
