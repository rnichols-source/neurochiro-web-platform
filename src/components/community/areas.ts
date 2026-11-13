export const AREAS = {
  home: { id: 'home', href: '/portal', label: 'Home', color: '#D66829', ink: '#B4501A', dark: '#B4501A', tint: '#FCEBDF' },
  care: { id: 'care', href: '/portal/care', label: 'Care', color: '#0E857A', ink: '#0A6159', dark: '#0A6159', tint: '#DCF1EE' },
  week: { id: 'week', href: '/portal/week', label: 'This Week', color: '#7A4A94', ink: '#5C3473', dark: '#5C3473', tint: '#EFE5F5' },
  refer: { id: 'refer', href: '/portal/refer', label: 'Find & Refer', color: '#2C6BB4', ink: '#1F4F8C', dark: '#1F4F8C', tint: '#E2ECF8' },
  me: { id: 'me', href: '/portal/me', label: 'Me', color: '#1E2D3B', ink: '#1E2D3B', dark: '#15202B', tint: '#E5E9EE' },
} as const

export type AreaId = keyof typeof AREAS

export const AREA_LIST = [AREAS.home, AREAS.care, AREAS.week, AREAS.refer, AREAS.me] as const

export function areaById(id: AreaId) {
  return AREAS[id]
}
