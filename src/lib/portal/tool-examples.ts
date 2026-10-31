export const EXAMPLE_CARE_PHASES = [
  { name: 'Intensive', visitsPerWeek: 3, weeks: 4 },
  { name: 'Corrective', visitsPerWeek: 2, weeks: 8 },
  { name: 'Stabilization', visitsPerWeek: 1, weeks: 12 },
] as const;

export function isUntouchedCarePlanDefault(state: {
  perVisitFee?: number | null;
  patientName?: string | null;
  phases?: { name?: string | null; visitsPerWeek?: number | null; weeks?: number | null }[] | null;
} | null | undefined): boolean {
  if (!state) return false;
  if (state.perVisitFee !== 65) return false;
  if ((state.patientName || '').trim()) return false;
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
    if (key === '__example') continue;
    const amount = Number(value);
    if (!Number.isNaN(amount)) plain[key] = amount;
  }
  return plain;
}
