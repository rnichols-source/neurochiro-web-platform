import Link from 'next/link';

const IDEAS = [
  {
    title: 'The nervous system runs the show',
    body: 'Structure and function meet in the nervous system. An adjustment is one way to change how that system is working, not a trick you perform on a bone.',
  },
  {
    title: 'Find it, adjust it, leave it alone',
    body: 'Look for what is actually interfering. Do the specific thing that addresses it. Then give the person time to respond before you add more.',
  },
  {
    title: 'The relationship is the practice',
    body: 'People stay when they understand their care and trust the doctor. Students here learn how to explain the work in plain language and how a visit actually runs.',
  },
];

export default function PhilosophyPage() {
  return (
    <div className="mx-auto max-w-2xl py-6 space-y-6">
      <header>
        <p className="dp-ui text-[12px] font-extrabold tracking-[0.12em] text-[#B4501A]">STUDENT TOOLS</p>
        <h1 className="mt-1 text-3xl font-extrabold text-[#15202B]">Philosophy</h1>
        <p className="mt-2 text-[16px] leading-7 text-[#3d4a57]">
          NeuroChiro is for chiropractors who center the nervous system. This page is the short version of that idea. The technique finder and the monthly call are where you go deeper.
        </p>
      </header>
      <div className="space-y-3">
        {IDEAS.map((idea) => (
          <article key={idea.title} className="rounded-2xl bg-white p-5" style={{ boxShadow: 'inset 0 0 0 1px #ECE8E1' }}>
            <h2 className="text-[18px] font-extrabold text-[#15202B]">{idea.title}</h2>
            <p className="mt-2 text-[15px] leading-6 text-[#3d4a57]">{idea.body}</p>
          </article>
        ))}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/student/techniques" className="dp-ui inline-flex min-h-11 items-center justify-center rounded-xl bg-[#D66829] px-4 text-[14px] font-extrabold text-white">Open the technique finder</Link>
        <Link href="/student/mentorship" className="dp-ui inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 text-[14px] font-extrabold text-[#15202B]" style={{ boxShadow: 'inset 0 0 0 1px #ECE8E1' }}>Monthly student call</Link>
      </div>
    </div>
  );
}
