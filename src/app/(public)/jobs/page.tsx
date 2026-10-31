import Link from 'next/link';
import { loadPublicBoard } from '@/lib/jobs/board';
import { isFeatured, payRange } from '@/lib/jobs/posting-pure';

export const dynamic = 'force-dynamic';

const TYPES = ['', 'Associate', 'Intern', 'Locum'];

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; type?: string; technique?: string }>;
}) {
  const filters = await searchParams;
  const jobs = await loadPublicBoard({
    state: filters.state,
    type: filters.type,
    technique: filters.technique,
  });
  const now = Date.now();

  return (
    <div className="min-h-dvh bg-[#F7F8FA] px-4 pb-16 pt-24">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-heading text-3xl font-bold text-[#14212E]">Associateships</h1>
        <p className="mt-2 text-base text-[#3d4d5c]">
          Open roles from NeuroChiro practices. Students can browse free. Membership is required to apply.
        </p>

        <form className="mt-6 grid gap-3 sm:grid-cols-3" action="/jobs">
          <label className="block text-sm text-[#3d4d5c]">
            State
            <input
              name="state"
              defaultValue={filters.state || ''}
              className="mt-1 min-h-11 w-full rounded-lg border border-[#e3e8ed] bg-white px-3 text-base"
            />
          </label>
          <label className="block text-sm text-[#3d4d5c]">
            Type
            <select
              name="type"
              defaultValue={filters.type || ''}
              className="mt-1 min-h-11 w-full rounded-lg border border-[#e3e8ed] bg-white px-3 text-base"
            >
              {TYPES.map((type) => (
                <option key={type || 'any'} value={type}>{type || 'Any'}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-[#3d4d5c]">
            Technique
            <input
              name="technique"
              defaultValue={filters.technique || ''}
              className="mt-1 min-h-11 w-full rounded-lg border border-[#e3e8ed] bg-white px-3 text-base"
            />
          </label>
          <button type="submit" className="min-h-11 rounded-lg bg-[#14212E] px-4 text-base font-bold text-white sm:col-span-3">
            Filter
          </button>
        </form>

        <div className="mt-6 space-y-3">
          {jobs.length === 0 ? (
            <p className="rounded-xl border border-[#e3e8ed] bg-white p-6 text-base text-[#3d4d5c]">
              No associateships match these filters.
            </p>
          ) : (
            jobs.map((job) => {
              const row = job as typeof job & {
                clinic_name?: string;
                city?: string;
                clinic_city?: string;
                salary_min?: number | null;
                salary_max?: number | null;
                compensation_min?: number | null;
                compensation_max?: number | null;
                poster_type?: string | null;
              };
              const city = row.city || row.clinic_city || '';
              const state = row.state || row.clinic_state || '';
              const place = [city, state].filter(Boolean).join(', ');
              const pay = payRange(row.salary_min || row.compensation_min, row.salary_max || row.compensation_max);
              const featured = isFeatured(row.featured_until, now);
              return (
                <Link
                  key={row.id}
                  href={`/jobs/${row.id}`}
                  className="block rounded-xl border border-[#e3e8ed] bg-white p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {featured ? <span className="text-sm font-bold text-[#B4501A]">Featured</span> : null}
                    {row.poster_type === 'member' ? <span className="text-sm text-[#3d4d5c]">Member practice</span> : null}
                  </div>
                  <h2 className="mt-1 font-heading text-xl font-bold text-[#14212E]">{row.title}</h2>
                  <p className="mt-1 text-base text-[#3d4d5c]">
                    {[row.clinic_name, place, row.type || row.employment_type, pay].filter(Boolean).join(' · ')}
                  </p>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
