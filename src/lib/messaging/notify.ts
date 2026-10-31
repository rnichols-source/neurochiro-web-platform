/** One unread notification per conversation, no matter how many messages arrive. */
export function recordIncoming(openThreads: Map<string, number>, conversationId: string): Map<string, number> {
  const next = new Map(openThreads);
  next.set(conversationId, 1);
  return next;
}

export function clearIncoming(openThreads: Map<string, number>, conversationId: string): Map<string, number> {
  const next = new Map(openThreads);
  next.delete(conversationId);
  return next;
}
