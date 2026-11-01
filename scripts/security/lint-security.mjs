import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../src/', import.meta.url))
const failures = []

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next') continue
    const path = join(dir, name)
    const info = statSync(path)
    if (info.isDirectory()) walk(path)
    else if (/\.(ts|tsx|js|jsx)$/.test(name)) check(path)
  }
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length
}

function check(path) {
  const text = readFileSync(path, 'utf8')
  if (!/['"]use client['"]/.test(text)) return
  const banned = /\.from\(\s*['"](leads|automation_queue|job_applications)['"]\s*\)/g
  for (const match of text.matchAll(banned)) {
    failures.push(`${path}:${lineOf(text, match.index)} client query on ${match[1]}`)
  }
  const own = /\.from\(\s*['"](profiles|students)['"]\s*\)/g
  for (const match of text.matchAll(own)) {
    const window = text.slice(match.index, match.index + 400)
    if (!/\.eq\(\s*['"]id['"]/.test(window)) {
      failures.push(`${path}:${lineOf(text, match.index)} client ${match[1]} read is not limited with .eq('id')`)
    }
  }
}

walk(root)
if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}
console.log('lint-security ok')
