export type AgendaItem = { time: string; title: string; description: string };
export type AgendaDay = { label: string; items: AgendaItem[] };
export type SponsorCredit = { name: string; context: string };

const PLACEHOLDER_TITLE = /^(session|tbd|tba|placeholder|untitled)$/i;

function row(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function text(value: unknown): string {
  return value == null ? "" : String(value).trim();
}

export function toAgendaItem(value: unknown): AgendaItem {
  const item = row(value);
  return {
    time: text(item?.time || item?.start),
    title: text(item?.title || item?.name),
    description: text(item?.description || item?.details),
  };
}

export function isRealAgendaItem(item: AgendaItem): boolean {
  return Boolean(item.title) && !PLACEHOLDER_TITLE.test(item.title);
}

export function normalizeAgenda(schedule: unknown): AgendaDay[] {
  if (!Array.isArray(schedule)) return [];
  const days: AgendaDay[] = [];
  const loose: AgendaItem[] = [];
  for (const entry of schedule) {
    const day = row(entry);
    if (!day) continue;
    if (Array.isArray(day.items)) {
      const items = day.items.map(toAgendaItem).filter(isRealAgendaItem);
      if (!items.length) continue;
      days.push({ label: text(day.day || day.date || day.label) || "Schedule", items });
      continue;
    }
    const item = toAgendaItem(day);
    if (isRealAgendaItem(item)) loose.push(item);
  }
  if (loose.length) days.push({ label: "Schedule", items: loose });
  return days;
}

function pushSponsor(found: SponsorCredit[], title: string) {
  const match = title.match(/sponsored by (.+)/i);
  if (!match) return;
  const name = match[1].trim();
  if (!name || found.some((sponsor) => sponsor.name.toLowerCase() === name.toLowerCase())) return;
  found.push({ name, context: title });
}

export function extractSponsors(schedule: unknown, extra?: unknown): SponsorCredit[] {
  const found: SponsorCredit[] = [];
  if (Array.isArray(schedule)) {
    for (const entry of schedule) {
      const day = row(entry);
      if (!day) continue;
      if (Array.isArray(day.items)) {
        for (const item of day.items) pushSponsor(found, toAgendaItem(item).title);
      } else {
        pushSponsor(found, toAgendaItem(day).title);
      }
    }
  }
  if (Array.isArray(extra)) {
    for (const item of extra) {
      if (typeof item === "string") pushSponsor(found, item.includes("ponsored") ? item : `Sponsored by ${item}`);
      else pushSponsor(found, text(row(item)?.name || row(item)?.title));
    }
  }
  return found;
}
