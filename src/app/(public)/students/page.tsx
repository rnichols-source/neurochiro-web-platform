import type { Metadata } from 'next';
import Link from 'next/link';
import { STUDENT_CONFIG } from '@/config/students';

export const metadata: Metadata = {
  title: 'NeuroChiro for students',
  description: 'School teaches you to pass boards. NeuroChiro shows you how to practice. $33 a month or $333 a year.',
  openGraph: {
    title: 'NeuroChiro for students',
    description: 'Real doctors, real clinics, and a monthly call with Dr. Ray.',
    url: 'https://www.neurochiro.co/students',
  },
};

const GET = [
  'A monthly call with Dr. Ray and a rotating guest doctor',
  'Doctors who opted in to meet students',
  'An associateships board you can browse free and apply to as a member',
  'ChiroMatch, where you and a practice both say yes',
  'Shadow days at clinics that offer them',
  'Student pricing on NeuroChiro seminars',
  'A roadmap from year 1 to your first 90 days in practice',
  'Academy, the interview playbook, Contract Lab, and the financial planner',
];

const FAQ = [
  ['Who is this for?', 'Chiropractic students. Patients and practicing doctors have their own accounts.'],
  ['Can I cancel?', 'Yes. Cancel in billing whenever you want. You keep access through the period you already paid.'],
  ['Do I have to verify my school?', 'Yes, before a doctor can see you in ChiroMatch. You confirm the school you attend and your graduation year.'],
  ['I study outside the US. Is the price different?', 'No. It is $33 USD a month, or $333 USD a year, everywhere.'],
  ['What happens on the monthly call?', 'Dr. Ray and a guest doctor talk through real practice questions. You can ask your own. Recordings are posted when the guest is comfortable with that.'],
  ['What can doctors see about me?', 'Before a match, a doctor sees your first name, last initial, school, graduation year, and your answers. Your email stays private. Messaging starts after you both say yes.'],
];

export default function StudentsPage() {
  const monthly = STUDENT_CONFIG.membership.monthly.usd;
  const annual = STUDENT_CONFIG.membership.annual.usd;
  return (
    <div className="bg-[#f7f8fa] text-[#16202a]">
      <section className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl md:text-4xl font-bold leading-tight">Become the chiropractor patients are looking for.</h1>
        <p className="mt-4 text-lg text-[#3d4a57]">School teaches you to pass boards. NeuroChiro shows you how to practice: real doctors, real clinics, and a monthly call with Dr. Ray.</p>
        <Link href="/get-started?role=student&plan=monthly" className="mt-6 min-h-11 inline-flex items-center rounded-lg bg-[#d66829] px-5 text-base font-bold text-white">Join as a student</Link>
      </section>

      <section className="max-w-3xl mx-auto px-4 pb-12">
        <h2 className="text-2xl font-bold">What you get</h2>
        <ul className="mt-4 space-y-3">
          {GET.map((item) => (
            <li key={item} className="bg-white border border-[#e3e8ed] rounded-xl px-4 py-3 text-base">{item}</li>
          ))}
        </ul>
      </section>

      <section className="max-w-3xl mx-auto px-4 pb-12">
        <h2 className="text-2xl font-bold">How the monthly call works</h2>
        <p className="mt-3 text-base text-[#3d4a57]">One hour. Dr. Ray hosts. A guest doctor rotates in. Members get the join link 15 minutes before the start, and a recording afterward when there is one. The date is posted on your Monthly call page once the first one is scheduled.</p>
      </section>

      <section className="max-w-3xl mx-auto px-4 pb-12">
        <h2 className="text-2xl font-bold">ChiroMatch in three steps</h2>
        <ol className="mt-4 space-y-3 list-decimal pl-5 text-base">
          <li>You and the doctor answer the same questions about technique, patients, pay, and timing.</li>
          <li>You each see a match percent and one plain reason. Either of you can say not now. The other person is not told.</li>
          <li>When both say yes, a message thread opens. From there you can plan a shadow day or a call.</li>
        </ol>
      </section>

      <section className="max-w-3xl mx-auto px-4 pb-12">
        <article className="bg-white border border-[#e3e8ed] rounded-xl p-6">
          <h2 className="text-2xl font-bold">{STUDENT_CONFIG.membership.tagline}</h2>
          <p className="mt-2 text-lg">${monthly}/month or ${annual}/year. That is two months free on the yearly plan.</p>
          <p className="mt-2 text-base text-[#3d4a57]">Cancel anytime. There is no free trial. Students who already have a free account keep access for 30 days after launch, then this price.</p>
          <Link href="/get-started?role=student&plan=monthly" className="mt-5 min-h-11 inline-flex items-center rounded-lg bg-[#d66829] px-5 text-base font-bold text-white">Join as a student</Link>
        </article>
      </section>

      <section className="max-w-3xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold">Questions</h2>
        <div className="mt-4 space-y-4">
          {FAQ.map(([question, answer]) => (
            <article key={question} className="bg-white border border-[#e3e8ed] rounded-xl p-4">
              <h3 className="text-lg font-bold">{question}</h3>
              <p className="mt-2 text-base text-[#3d4a57]">{answer}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
