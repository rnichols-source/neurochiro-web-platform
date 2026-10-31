export function priceMatches(
  unitAmount: number | null | undefined,
  interval: string | null | undefined,
  expectCents: number,
  expectInterval: string,
): boolean {
  return unitAmount === expectCents && interval === expectInterval;
}
