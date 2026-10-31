import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

export default function EmptyState({
  icon: Icon,
  title,
  sentence,
  action,
}: {
  icon: LucideIcon;
  title: string;
  sentence: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="bg-white border border-portal-border rounded-xl px-6 py-10 text-center">
      <Icon className="w-6 h-6 mx-auto text-portal-muted" aria-hidden />
      <h2 className="mt-3 text-lg font-bold text-portal-ink">{title}</h2>
      <p className="mt-1 text-[15px] leading-6 text-portal-ink-2 max-w-md mx-auto">{sentence}</p>
      {action ? (
        <Link href={action.href} className="mt-4 min-h-11 inline-flex items-center px-4 rounded-lg bg-portal-accent text-sm font-bold text-white">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
