'use server';

import { revalidatePath } from 'next/cache';
import { closeMatch, decide, loadDesk, reportOutcome, saveProfile, setOpenToStudents, suggestCall } from './store';

function refresh() {
  revalidatePath('/student/match');
  revalidatePath('/doctor/match');
}

export async function saveMatchProfile(raw: unknown, visible: boolean) {
  const result = await saveProfile(raw, visible);
  if (!result.error) refresh();
  return result;
}

export async function decideMatch(otherUserId: string, decision: 'interested' | 'not_now') {
  const result = await decide(otherUserId, decision);
  if (!result.error) refresh();
  return result;
}

export async function closeMatchAction(matchId: string, reason: string) {
  const result = await closeMatch(matchId, reason);
  if (!result.error) refresh();
  return result;
}

export async function reportMatchOutcome(matchId: string, outcome: string, note: string) {
  const result = await reportOutcome(matchId, outcome, note);
  if (!result.error) refresh();
  return result;
}

export async function suggestMatchCall(matchId: string, times: string[]) {
  return suggestCall(matchId, times);
}

export async function setMatchOpen(on: boolean) {
  const result = await setOpenToStudents(on);
  if (!result.error) refresh();
  return result;
}

export async function moreMatches(cursor: string) {
  const data = await loadDesk(Number(cursor) || 0);
  return { candidates: data.candidates, nextCursor: data.nextCursor, empty: data.empty };
}
