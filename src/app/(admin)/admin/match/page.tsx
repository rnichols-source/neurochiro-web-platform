import Link from 'next/link';
import { adminMatchStats } from '@/lib/match/store';
import { WEIGHTS_V1, SCORE_VERSION } from '@/lib/match/score';

export default async function AdminMatchPage() {
  const stats = await adminMatchStats();
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-[#14212e]">ChiroMatch</h1>
      <p className="mt-2 text-base text-[#3d4d5c]">Counts only. Weight changes stay in code until Raymond approves them.</p>
      <p className="mt-2 text-sm text-[#3d4d5c]">The admin sidebar was left as it is. Open this page directly.</p>
      {!stats.ready ? <p className="mt-6 text-base">Run the ChiroMatch migration first.</p> : (
        <>
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Student profiles" value={stats.sides.student} />
            <Stat label="Doctor profiles" value={stats.sides.doctor} />
            <Stat label="Interested" value={stats.interested} />
            <Stat label="Not now" value={stats.passed} />
            <Stat label="Matches" value={stats.matches} />
            <Stat label="Outcomes" value={stats.outcomes.length} />
          </dl>
          <p className="mt-6 text-base">Active weights: {stats.weightVersion}. Code version: {SCORE_VERSION}.</p>
          <pre className="mt-2 overflow-auto rounded-lg border border-[#e3e8ed] bg-white p-3 text-sm">{JSON.stringify(WEIGHTS_V1, null, 2)}</pre>
          <Link href="/admin/match/export" className="mt-4 inline-flex min-h-11 items-center text-base font-bold text-[#B4501A]">Download outcomes CSV</Link>
          <div className="mt-6 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="py-2 pr-3">Outcome</th>
                  <th className="py-2 pr-3">Note</th>
                  <th className="py-2">When</th>
                </tr>
              </thead>
              <tbody>
                {stats.outcomes.map((row) => (
                  <tr key={row.id} className="border-t border-[#e3e8ed]">
                    <td className="py-2 pr-3">{row.outcome}</td>
                    <td className="py-2 pr-3">{row.note || '—'}</td>
                    <td className="py-2">{row.created_at?.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#e3e8ed] bg-white p-3">
      <dt className="text-sm text-[#3d4d5c]">{label}</dt>
      <dd className="text-2xl font-bold text-[#14212e]">{value}</dd>
    </div>
  );
}
