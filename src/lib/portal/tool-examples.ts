export const EXAMPLE_CARE_PHASES = [
  { name: 'Intensive', visitsPerWeek: 3, weeks: 4 },
  { name: 'Corrective', visitsPerWeek: 2, weeks: 8 },
  { name: 'Stabilization', visitsPerWeek: 1, weeks: 12 },
] as const;

export function cleanPracticeField(value: unknown, fallback: string): string {
  const text = String(value ?? '').trim();
  if (!text || text.includes('[')) return fallback;
  return text;
}

export function isUntouchedCarePlanDefault(state: {
  perVisitFee?: number | null;
  patientName?: string | null;
  phases?: { name?: string | null; visitsPerWeek?: number | null; weeks?: number | null }[] | null;
  __example?: unknown;
  __confirmed?: unknown;
} | null | undefined): boolean {
  if (!state) return false;
  if (state.__confirmed === true) return false;
  if (state.__example === true) return true;
  if (state.perVisitFee !== 65) return false;
  const phases = state.phases || [];
  if (phases.length !== EXAMPLE_CARE_PHASES.length) return false;
  return phases.every((phase, index) => {
    const sample = EXAMPLE_CARE_PHASES[index];
    return phase.name === sample.name
      && Number(phase.visitsPerWeek) === sample.visitsPerWeek
      && Number(phase.weeks) === sample.weeks;
  });
}

export function matchesPlExample(
  values: Record<string, unknown> | null | undefined,
  examples: { id: string; lineItems: Record<string, number> }[],
): string | null {
  if (!values || typeof values !== 'object') return null;
  const marker = values.__example;
  if (typeof marker === 'string' && examples.some((example) => example.id === marker)) return marker;
  const saved = Object.fromEntries(
    Object.entries(values).filter(([key]) => key !== '__example'),
  );
  for (const example of examples) {
    const keys = new Set([...Object.keys(example.lineItems), ...Object.keys(saved)]);
    let same = true;
    for (const key of keys) {
      if (Number(example.lineItems[key] || 0) !== Number(saved[key] || 0)) {
        same = false;
        break;
      }
    }
    if (same) return example.id;
  }
  return null;
}

export function plainPlValues(values: Record<string, unknown>): Record<string, number> {
  const plain: Record<string, number> = {};
  for (const [key, value] of Object.entries(values)) {
    if (key.startsWith('__')) continue;
    const amount = Number(value);
    if (!Number.isNaN(amount)) plain[key] = amount;
  }
  return plain;
}

/** A saved example without a confirmation opens blank, with undo still available. */
export function plInitialView(
  saved: Record<string, unknown> | null | undefined,
  examples: { id: string; lineItems: Record<string, number> }[],
): { mode: 'blank' | 'saved'; exampleId: string | null; cleared: boolean } {
  if (!saved) return { mode: 'blank', exampleId: null, cleared: false };
  if (saved.__confirmed === true) return { mode: 'saved', exampleId: null, cleared: false };
  const match = matchesPlExample(saved, examples);
  if (match && saved.__confirmed !== true) return { mode: 'blank', exampleId: match, cleared: true };
  return { mode: 'saved', exampleId: null, cleared: false };
}
