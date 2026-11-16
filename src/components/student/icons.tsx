import type { StudentPlaceId } from '@/lib/students/places';

type IconProps = { size?: number; strokeWidth?: number };

const svg = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true as const,
};

export function StudentPlaceIcon({ id, size = 22, strokeWidth = 2 }: IconProps & { id: StudentPlaceId }) {
  const props = { ...svg, width: size, height: size, strokeWidth };
  if (id === 'home') {
    return (
      <svg {...props}>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
      </svg>
    );
  }
  if (id === 'call') {
    return (
      <svg {...props}>
        <path d="M8 10a8 8 0 0 0 6 6" />
        <path d="M15.5 16.5 17 21l-3.2-.8A11 11 0 0 1 4 8.2L3.2 5 7.7 6.5A8 8 0 0 0 15.5 16.5Z" />
      </svg>
    );
  }
  if (id === 'match') {
    return (
      <svg {...props}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }
  if (id === 'jobs') {
    return (
      <svg {...props}>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

export function StudentSignOutIcon() {
  return (
    <svg {...svg} width={18} height={18} strokeWidth={2}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}
