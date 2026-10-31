import Link from 'next/link';

type Action = { label: string; href: string };

export default function PageHeader({
  title,
  description,
  primary,
  secondary,
  action,
}: {
  title: string;
  description?: string;
  primary?: Action;
  secondary?: Action;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
      <div className="min-w-0">
        <h1 className="text-[26px] leading-8 font-bold text-portal-ink">{title}</h1>
        {description ? <p className="mt-1 text-[15px] leading-6 text-portal-ink-2">{description}</p> : null}
      </div>
      {(primary || secondary || action) && (
        <div className="flex flex-wrap gap-2">
          {action}
          {secondary ? (
            <Link href={secondary.href} className="min-h-11 inline-flex items-center px-4 rounded-lg border border-portal-border bg-white text-sm font-bold text-portal-ink">
              {secondary.label}
            </Link>
          ) : null}
          {primary ? (
            <Link href={primary.href} className="min-h-11 inline-flex items-center px-4 rounded-lg bg-portal-accent text-sm font-bold text-white">
              {primary.label}
            </Link>
          ) : null}
        </div>
      )}
    </header>
  );
}
