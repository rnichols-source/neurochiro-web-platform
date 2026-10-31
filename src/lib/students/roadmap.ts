export function autoCompletedSteps(evidence: { quizDone?: boolean; contractSaved?: boolean; rsvped?: boolean }): string[] {
  const done: string[] = [];
  if (evidence.quizDone) done.push('technique-quiz');
  if (evidence.contractSaved) done.push('sample-contract');
  if (evidence.rsvped) done.push('monthly-call');
  return done;
}
