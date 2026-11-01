export type PopupFields = {
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
export function renderDoctorPopup(doc: PopupFields, createElement: (tag: string) => PopupNode): PopupNode {
  const root = createElement('div')
  const name = createElement('div')
  name.textContent = doc.name
  root.appendChild(name)

  const practice = createElement('div')
  practice.textContent = doc.practice
  root.appendChild(practice)

  const city = createElement('div')
  city.textContent = doc.city
  root.appendChild(city)

  const billing = createElement('div')
  billing.textContent = doc.billing
  root.appendChild(billing)

  const link = createElement('a')
  link.textContent = 'Open member'
  link.setAttribute?.('href', `/admin/members?q=${encodeURIComponent(doc.name)}`)
  root.appendChild(link)
  return root
}
