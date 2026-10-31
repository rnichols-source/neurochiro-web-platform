export function appendUtm(url: string, campaign: string): string {
  const target = new URL(url);
  if (target.protocol !== "https:") throw new Error("Registration link must be HTTPS");
  const set = (key: string, value: string) => {
    if (!target.searchParams.has(key)) target.searchParams.set(key, value);
  };
  set("utm_source", "neurochiro");
  set("utm_medium", "seminar");
  set("utm_campaign", campaign);
  return target.toString();
}

export function memberTicketPrice(input: {
  price: number;
  memberPrice?: number | null;
  earlyBirdPrice?: number | null;
  earlyBirdEndsAt?: string | null;
  isMember: boolean;
  discountPct: number;
  now?: Date;
}): { amount: number; memberDiscountApplied: boolean; earlyBird: boolean } {
  const now = input.now || new Date();
  const early = input.earlyBirdPrice != null && input.earlyBirdEndsAt && now < new Date(input.earlyBirdEndsAt);
  const base = early ? Number(input.earlyBirdPrice) : Number(input.price);
  if (input.isMember && input.memberPrice != null) {
    return { amount: Number(input.memberPrice), memberDiscountApplied: true, earlyBird: !!early };
  }
  if (input.isMember && input.discountPct > 0) {
    const discounted = Math.round(base * (100 - input.discountPct)) / 100;
    return { amount: discounted, memberDiscountApplied: true, earlyBird: !!early };
  }
  return { amount: base, memberDiscountApplied: false, earlyBird: !!early };
}

export function holdActive(holdExpiresAt: string | null, now = Date.now()): boolean {
  if (!holdExpiresAt) return false;
  return new Date(holdExpiresAt).getTime() > now;
}

export function seatsAvailable(input: {
  capacity: number | null;
  sold: number;
  pendingHolds: number;
}): number | null {
  if (input.capacity == null) return null;
  return input.capacity - input.sold - input.pendingHolds;
}
