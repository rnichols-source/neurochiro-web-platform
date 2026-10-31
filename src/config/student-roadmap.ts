// RAYMOND: review wording.

export type RoadmapStep = { key: string; title: string; why: string; link: string };
export type RoadmapStage = { key: string; title: string; steps: RoadmapStep[] };

export const STUDENT_ROADMAP: RoadmapStage[] = [
  {
    key: 'year-1',
    title: 'Year 1',
    steps: [
      { key: 'technique-quiz', title: 'Take the technique-fit quiz', why: 'You need a short list of techniques that fit how you want to practice.', link: '/student/techniques' },
      { key: 'watch-one-seminar', title: 'Look at one upcoming seminar', why: 'See what a live room with these doctors actually feels like.', link: '/student/seminars' },
      { key: 'profile-basics', title: 'Finish your school and graduation year', why: 'Doctors cannot place you without those two facts.', link: '/student/welcome' },
      { key: 'read-directory', title: 'Read three doctor profiles', why: 'Notice how a clinic describes the patients it wants.', link: '/student/doctors' },
    ],
  },
  {
    key: 'year-2',
    title: 'Year 2',
    steps: [
      { key: 'shadow-styles', title: 'Shadow 2 different practice styles', why: 'A high-volume office and a longer-visit office teach different jobs.', link: '/student/doctors?badge=shadow' },
      { key: 'monthly-call', title: 'Join a monthly call', why: 'Ask one question you cannot get from a textbook.', link: '/student/mentorship' },
      { key: 'interview-ten', title: 'Practice 10 interview questions', why: 'The first answers are stiff. The tenth one sounds like you.', link: '/student/interview-prep' },
      { key: 'academy-start', title: 'Start one Academy course', why: 'Pick the course closest to the kind of office you want.', link: '/student/academy' },
    ],
  },
  {
    key: 'year-3',
    title: 'Year 3',
    steps: [
      { key: 'sample-contract', title: 'Review a sample associate contract', why: 'You should know a non-compete and a pay plan before someone hands you one.', link: '/student/contract-lab' },
      { key: 'money-sketch', title: 'Sketch a first-year budget', why: 'Loan payment, rent, and take-home pay should be numbers, not a guess.', link: '/student/financial-planner' },
      { key: 'jobs-browse', title: 'Browse associateships without applying yet', why: 'See what clinics ask for a year before you need the job.', link: '/student/jobs' },
      { key: 'mentor-note', title: 'Message one doctor who opted in', why: 'A short, specific note beats a blast to the whole directory.', link: '/student/doctors' },
    ],
  },
  {
    key: 'final-year',
    title: 'Final year',
    steps: [
      { key: 'match-profile', title: 'Fill in your ChiroMatch profile', why: 'Practices can only respond to answers you actually gave.', link: '/student/match' },
      { key: 'apply-two', title: 'Apply to two associateships', why: 'One offer is a coin flip. Two lets you compare.', link: '/student/jobs' },
      { key: 'contract-real', title: 'Run your real offer through Contract Lab', why: 'Do this before you sign, not after.', link: '/student/contract-lab' },
      { key: 'shadow-final', title: 'Spend a day in the office you might join', why: 'The ad and the Tuesday afternoon are different things.', link: '/student/doctors?badge=shadow' },
      { key: 'license-plan', title: 'Write down the state where you will apply for a license', why: 'Boards and paperwork have lead time.', link: '/student/roadmap' },
    ],
  },
  {
    key: 'boards',
    title: 'Boards and licensing',
    steps: [
      { key: 'board-dates', title: 'Put your board dates on a calendar', why: 'The rest of the plan hangs on that week.', link: '/student/roadmap' },
      { key: 'ce-log', title: 'Log any CE you already have', why: 'Some states count student hours. Some do not. Know which.', link: '/student/ce-tracker' },
      { key: 'license-checklist', title: 'List the license steps for your state', why: 'Fingerprints, transcripts, and fees are the usual delays.', link: '/student/roadmap' },
      { key: 'ask-a-doctor', title: 'Ask a doctor in that state what surprised them', why: 'The form never mentions the slow part.', link: '/student/mentorship' },
    ],
  },
  {
    key: 'first-90',
    title: 'First 90 days',
    steps: [
      { key: 'week-one', title: 'Write what you will watch in week one', why: 'Shadow the doctor, the front desk, and the re-exam.', link: '/student/doctors' },
      { key: 'pay-check', title: 'Check the first pay stub against the contract', why: 'Bonus math is where offers go quiet.', link: '/student/contract-lab' },
      { key: 'budget-live', title: 'Replace the sample budget with your real numbers', why: 'The planner is only useful with your rent and your loan.', link: '/student/financial-planner' },
      { key: 'stay-on-the-call', title: 'Keep coming to the monthly call', why: 'The questions get more useful after you have patients.', link: '/student/mentorship' },
    ],
  },
];

export function nextRoadmapSteps(done: string[], limit = 3) {
  const all = STUDENT_ROADMAP.flatMap((stage) => stage.steps.map((step) => ({ ...step, stage: stage.title })));
  return all.filter((step) => !done.includes(step.key)).slice(0, limit);
}
