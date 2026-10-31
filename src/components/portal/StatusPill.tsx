const TONES = {
  new: 'bg-portal-accent-50 text-portal-accent',
  follow: 'bg-portal-warning-bg text-portal-warning',
  booked: 'bg-portal-success-bg text-portal-success',
  info: 'bg-portal-info-bg text-portal-info',
  neutral: 'bg-portal-surface text-portal-ink-2',
  danger: 'bg-portal-danger-bg text-portal-danger',
} as const;

export default function StatusPill({ label, tone = 'neutral' }: { label: string; tone?: keyof typeof TONES }) {
  return <span className={`inline-flex items-center min-h-6 px-2 rounded-lg text-[13px] leading-5 font-bold ${TONES[tone]}`}>{label}</span>;
}
