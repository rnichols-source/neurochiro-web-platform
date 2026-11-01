import assert from 'node:assert/strict'
import test from 'node:test'
import { renderDoctorPopup, type PopupNode } from './popup-dom.ts'

type Stub = PopupNode & {
  children: Stub[]
  attrs: Record<string, string>
}

function createElement(tag: string): Stub {
  const node: Stub = {
    tagName: tag,
    textContent: null,
    children: [],
    attrs: {},
    appendChild(child) {
      this.children.push(child as Stub)
    },
    setAttribute(name, value) {
      this.attrs[name] = value
    },
  }
  return node
}

function walk(node: Stub, visit: (item: Stub) => void) {
  visit(node)
  for (const child of node.children) walk(child, visit)
}

test('clinic markup stays literal text and does not create an image', () => {
  const clinic = '<img src=x onerror=alert(1)>'
  const root = renderDoctorPopup(
    { name: 'Dr. Ada Lovelace', practice: clinic, city: 'Austin, TX', billing: 'Paying' },
    createElement,
  ) as Stub

  const tags: string[] = []
  const texts: string[] = []
  walk(root, (node) => {
    tags.push(node.tagName.toLowerCase())
    if (node.textContent) texts.push(node.textContent)
  })

  assert.equal(texts.includes(clinic), true)
  assert.equal(tags.includes('img'), false)
  assert.equal(tags.includes('a'), true)
})
