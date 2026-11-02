export type PopupFields = {
  id: string
  name: string
  practice: string
  city: string
  billing: string
}

export type PopupNode = {
  textContent: string | null
  tagName: string
  appendChild: (child: PopupNode) => void
  setAttribute?: (name: string, value: string) => void
}

/** Build a doctor popup from text nodes. Clinic and city are never parsed as HTML. */
export function renderDoctorPopup(docs: PopupFields | PopupFields[], createElement: (tag: string) => PopupNode): PopupNode {
  const list = Array.isArray(docs) ? docs : [docs]
  const root = createElement('div')
  list.forEach((doc, index) => {
    const block = createElement('div')
    const name = createElement('div')
    name.textContent = doc.name
    block.appendChild(name)

    const practice = createElement('div')
    practice.textContent = doc.practice
    block.appendChild(practice)

    const city = createElement('div')
    city.textContent = doc.city
    block.appendChild(city)

    const billing = createElement('div')
    billing.textContent = doc.billing
    block.appendChild(billing)

    const link = createElement('a')
    link.textContent = 'Open member'
    link.setAttribute?.('href', `/admin/members?member=${encodeURIComponent(doc.id)}`)
    block.appendChild(link)
    if (index > 0) block.setAttribute?.('data-stack', String(index))
    root.appendChild(block)
  })
  return root
}
