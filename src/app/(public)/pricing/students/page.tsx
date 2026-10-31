import Link from 'next/link';
import { STUDENT_CONFIG } from '@/config/students';

export const metadata = {
  title: 'Student membership',
  description: 'NeuroChiro student membership is $33 a month or $333 a year.',
};

export default function StudentPricing() {
  const monthly = STUDENT_CONFIG.membership.monthly.usd;
  const annual = STUDENT_CONFIG.membership.annual.usd;
  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-[#16202a]">Student membership</h1>
      <p className="mt-3 text-base text-[#3d4a57]">{STUDENT_CONFIG.membership.tagline}</p>
      <article className="mt-6 bg-white border border-[#e3e8ed] rounded-xl p-6">
        <p className="text-3xl font-bold text-[#16202a]">${monthly}/month</p>
        <p className="mt-1 text-lg text-[#16202a]">${annual}/year</p>
        <p className="mt-2 text-base text-[#3d4a57]">Two months free on the yearly plan. Cancel anytime.</p>
        <Link href="/students" className="mt-4 inline-flex min-h-11 items-center text-base font-bold text-[#d66829]">See what is included</Link>
        <Link href="/get-started?role=student&plan=monthly" className="mt-4 min-h-11 w-full inline-flex items-center justify-center rounded-lg bg-[#d66829] px-4 text-base font-bold text-white">Join as a student</Link>
      </article>
    </div>
  );
}
