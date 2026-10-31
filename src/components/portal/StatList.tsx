import { Info } from 'lucide-react';

export type StatRow = { label: string; value: string; hint: string };

export default function StatList({ title, rows }: { title: string; rows: StatRow[] }) {
  return (
    <section className="bg-white border border-portal-border rounded-xl">
      <h2 className="px-4 pt-4 text-lg font-bold text-portal-ink">{title}</h2>
      <dl>
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 px-4 py-3 border-t border-portal-border first:border-t-0">
            <dt className="text-[15px] text-portal-ink-2 flex items-center">
              {row.label}
              <button type="button" className="min-h-11 min-w-11 inline-flex items-center justify-center text-portal-muted" aria-label={row.hint} title={row.hint}>
                <Info className="w-4 h-4" aria-hidden />
              </button>
            </dt>
            <dd className="text-base font-bold text-portal-ink tabular-nums">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
