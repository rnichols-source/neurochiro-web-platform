import { renderDoctorPopup, type PopupFields, type PopupNode } from '@/lib/admin/popup-dom'

class DomNode implements PopupNode {
  readonly element: HTMLElement
  readonly tagName: string

  constructor(tag: string) {
    this.element = document.createElement(tag)
    this.tagName = this.element.tagName
  }

  get textContent(): string | null {
    return this.element.textContent
  }

  set textContent(value: string | null) {
    this.element.textContent = value
  }

  appendChild(child: PopupNode) {
    if (child instanceof DomNode) this.element.appendChild(child.element)
  }

  setAttribute(name: string, value: string) {
    this.element.setAttribute(name, value)
  }
}

export function buildDoctorPopup(doc: PopupFields): HTMLElement {
  const root = renderDoctorPopup(doc, (tag) => new DomNode(tag))
  if (!(root instanceof DomNode)) return document.createElement('div')
  root.element.style.padding = '12px'
  root.element.style.maxWidth = '260px'
  root.element.style.fontFamily = 'system-ui, sans-serif'
  root.element.style.color = '#1E2D3B'
  const link = root.element.querySelector('a')
  if (link) {
    link.style.display = 'inline-flex'
    link.style.alignItems = 'center'
    link.style.minHeight = '44px'
    link.style.marginTop = '8px'
    link.style.color = '#D66829'
    link.style.fontWeight = '700'
    link.style.textDecoration = 'none'
  }
  return root.element
}
