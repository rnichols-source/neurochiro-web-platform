export type GapMessage = {
  id: string;
  client_message_id?: string | null;
  created_at: string;
};

/** Merge a gap-fill into the open thread. One row per id and per client id, oldest first. */
export function mergeMessages<T extends GapMessage>(existing: T[], incoming: T[]): T[] {
  const byId = new Map<string, T>();
  const clientToId = new Map<string, string>();

  const place = (msg: T) => {
    if (msg.client_message_id) {
      const previousId = clientToId.get(msg.client_message_id);
      if (previousId && previousId !== msg.id) byId.delete(previousId);
      clientToId.set(msg.client_message_id, msg.id);
    }
    const prior = byId.get(msg.id);
    byId.set(msg.id, prior ? { ...prior, ...msg } : msg);
  };

  for (const msg of existing) place(msg);
  for (const msg of incoming) place(msg);

  return [...byId.values()].sort((a, b) => {
    if (a.created_at === b.created_at) return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    return a.created_at < b.created_at ? -1 : 1;
  });
}

export const REALTIME_BACKOFF_MS = [1000, 2000, 5000, 10000, 30000] as const;

export function nextBackoffMs(attempt: number): number {
  const index = Math.min(Math.max(attempt, 0), REALTIME_BACKOFF_MS.length - 1);
  return REALTIME_BACKOFF_MS[index];
}
