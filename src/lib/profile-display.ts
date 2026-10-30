const HONORIFIC = /^(dr|doctor|mr|mrs|ms|miss|prof|professor)\.?$/i;

function norm(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function isStateOrZip(part: string, state?: string | null): boolean {
  if (/^\d{5}(?:-\d{4})?$/.test(part)) return true;
  if (/^[A-Za-z]{2}\s+\d{5}(?:-\d{4})?$/.test(part)) return true;
  if (state && norm(part) === norm(state)) return true;
  return false;
}

/** Collapse repeated city/state fragments inside a stored address. */
export function cleanAddressLine(
  address: string | null | undefined,
  city?: string | null,
  state?: string | null,
): string {
  if (!address?.trim()) return "";

  const pieces = address
    .split(",")
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const deduped: string[] = [];
  const seen = new Set<string>();
  for (const part of pieces) {
    const key = norm(part);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(part);
  }

  const kept = deduped.filter((part, index) => {
    const current = norm(part);
    const dominated = deduped.some((other, otherIndex) => {
      if (index === otherIndex) return false;
      const candidate = norm(other);
      return candidate.startsWith(`${current} `) && candidate.length > current.length + 1;
    });
    return !dominated;
  });

  const tail = kept.filter((part) => isStateOrZip(part, state));
  const head = kept.filter((part) => !isStateOrZip(part, state));
  return [...head, ...tail].join(", ");
}

/** Address line for patients, with city and state added only when missing. */
export function displayAddress(
  address: string | null | undefined,
  city?: string | null,
  state?: string | null,
): string {
  const line = cleanAddressLine(address, city, state);
  const lower = line.toLowerCase();
  const extra: string[] = [];
  const cityName = city?.trim();
  const stateName = state?.trim();
  if (cityName && !lower.includes(cityName.toLowerCase())) extra.push(cityName);
  if (stateName && !new RegExp(`\\b${stateName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(line)) {
    extra.push(stateName);
  }
  return [line, ...extra].filter(Boolean).join(", ");
}

export function addressForSchema(
  address: string | null | undefined,
  city?: string | null,
  state?: string | null,
) {
  const line = cleanAddressLine(address, city, state);
  const parts = line.split(",").map((part) => part.trim()).filter(Boolean);
  const postalCode = line.match(/\b\d{5}(?:-\d{4})?\b/)?.[0];
  const locality = parts.find((part) => {
    if (!city?.trim()) return false;
    const current = norm(part);
    const cityName = norm(city);
    return current === cityName || current.startsWith(`${cityName} `);
  }) || city?.trim() || undefined;

  const streetAddress = parts.filter((part) => {
    if (locality && norm(part) === norm(locality)) return false;
    if (isStateOrZip(part, state)) return false;
    if (postalCode && norm(part) === norm(postalCode)) return false;
    return true;
  }).join(", ");

  return {
    line: displayAddress(address, city, state),
    streetAddress: streetAddress || undefined,
    locality,
    region: state?.trim() || undefined,
    postalCode,
  };
}

export function nameInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "";
  const parts = name.trim().split(/\s+/).filter((part) => !HONORIFIC.test(part));
  if (parts.length === 0) return "";
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || "" : "";
  return `${first}${last}`.toUpperCase();
}

export function uniqueLabels(labels: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const label of labels) {
    const trimmed = (label || "").trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    unique.push(trimmed);
  }
  return unique;
}
