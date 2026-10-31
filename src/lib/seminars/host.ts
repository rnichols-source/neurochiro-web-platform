import { SEMINAR_CONFIG } from "../../config/seminars.ts";

export type HostCredit = {
  name: string | null;
  profileSlug: string | null;
  verified: boolean;
};

type HostDoctor = {
  slug: string;
  first_name: string | null;
  last_name: string | null;
  photo_url?: string | null;
  clinic_name?: string | null;
} | null;

function tidy(value?: string | null): string {
  return (value || "").trim().toLowerCase().replace(/\./g, "").replace(/\s+/g, " ");
}

export function isAdminHost(input: { slug?: string | null; name?: string | null }): boolean {
  const slug = (input.slug || "").trim().toLowerCase();
  if (slug && SEMINAR_CONFIG.adminHosts.slugs.some((item) => item === slug)) return true;
  const name = tidy(input.name);
  if (!name) return false;
  return SEMINAR_CONFIG.adminHosts.names.some((item) => tidy(item) === name);
}

function firstHost(hosts: unknown): { name: string; slug: string } | null {
  if (!Array.isArray(hosts) || hosts.length === 0) return null;
  const entry = hosts[0];
  if (!entry || typeof entry !== "object") return null;
  const row = entry as Record<string, unknown>;
  const name = String(row.name || row.display_name || row.org_name || "").trim();
  const slug = String(row.slug || row.doctor_slug || "").trim();
  if (!name && !slug) return null;
  return { name, slug };
}

export function resolveSeminarHost(input: {
  hosts?: unknown;
  instructorName?: string | null;
  hostDoctor?: HostDoctor;
}): HostCredit {
  const entry = firstHost(input.hosts);
  if (entry?.name && !isAdminHost({ slug: entry.slug, name: entry.name })) {
    const verified = Boolean(entry.slug) && !isAdminHost({ slug: entry.slug, name: entry.name });
    return { name: entry.name, profileSlug: verified ? entry.slug : null, verified };
  }
  const instructor = (input.instructorName || "").trim();
  if (instructor) return { name: instructor, profileSlug: null, verified: false };
  const doctor = input.hostDoctor;
  if (!doctor) return { name: null, profileSlug: null, verified: false };
  const name = [doctor.first_name, doctor.last_name].filter(Boolean).join(" ").trim();
  if (isAdminHost({ slug: doctor.slug, name })) return { name: null, profileSlug: null, verified: false };
  return { name: name || null, profileSlug: doctor.slug, verified: true };
}
