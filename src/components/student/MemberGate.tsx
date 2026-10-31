import Link from 'next/link';
import { STUDENT_CONFIG } from '@/config/students';

const INCLUDED = [
  'A monthly call with Dr. Ray and a guest doctor',
  'Doctors who have opted in, and shadow days',
  'Associateships you can apply to',
  'ChiroMatch, when a practice and you both say yes',
  'Student pricing on seminars',
  'Academy, the interview playbook, Contract Lab, and the financial planner',
];

export default function MemberGate({
  feature,
  description,
}: {
  feature: string;
  description: string;
}) {
  const monthly = STUDENT_CONFIG.membership.monthly.usd;
  const annual = STUDENT_CONFIG.membership.annual.usd;
  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <article className="bg-white border border-portal-border rounded-xl p-6">
        <h1 className="text-2xl font-bold text-portal-ink">{feature}</h1>
        <p className="mt-2 text-base text-portal-ink-2">{description}</p>
        <h2 className="mt-6 text-lg font-bold text-portal-ink">What membership includes</h2>
        <ul className="mt-3 space-y-2">
          {INCLUDED.map((item) => (
            <li key={item} className="text-base text-portal-ink">{item}</li>
          ))}
        </ul>
        <div className="mt-6 flex flex-col gap-3">
          <Link href="/student/subscribe?plan=monthly" className="min-h-11 inline-flex items-center justify-center rounded-lg bg-portal-accent px-4 text-base font-bold text-white">
            Join for ${monthly}/month
          </Link>
          <Link href="/student/subscribe?plan=annual" className="min-h-11 inline-flex items-center justify-center text-base font-bold text-portal-ink">
            or ${annual}/year
          </Link>
        </div>
      </article>
    </div>
  );
}

export function SoonNotice({ feature, description }: { feature: string; description: string }) {
  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <article className="bg-white border border-portal-border rounded-xl p-6">
        <h1 className="text-2xl font-bold text-portal-ink">{feature}</h1>
        <p className="mt-2 text-base text-portal-ink-2">{description}</p>
      </article>
    </div>
  );
}
