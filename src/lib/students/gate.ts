export function memberGateDecision(input: { requiresMember: boolean; status: string }): 'open' | 'locked' {
  if (!input.requiresMember) return 'open';
  if (input.status === 'member' || input.status === 'grace' || input.status === 'past_due') return 'open';
  return 'locked';
}

export function aiUsageAllowed(used: number, limit: number): boolean {
  return used < limit;
}
