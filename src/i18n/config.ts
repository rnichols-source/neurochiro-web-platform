/**
 * Patient-facing locales.
 *
 * English is the default and has no URL prefix, so links such as
 * https://neurochiro.co/directory keep working.
 * Other languages use a prefix (`/fr/...`). Add a language by:
 * 1. appending its code to LOCALES
 * 2. giving it a prefix in LOCALE_PREFIX
 * 3. adding src/i18n/dictionaries/<code>.ts
 */

export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "nc_locale";
export const SUGGEST_COOKIE = "nc_fr_suggest";
export const LOCALE_HEADER = "x-nc-locale";

/** URL prefix for every locale except English. */
export const LOCALE_PREFIX: Partial<Record<Locale, string>> = {
  fr: "/fr",
};

/** App areas that stay on their current URLs. Their screens are not translated. */
const UNPREFIXED = ["/doctor", "/student", "/admin", "/portal", "/dashboard", "/api"];

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "fr";
}

export function splitLocalePrefix(pathname: string): { locale: Locale; pathname: string } {
  for (const locale of LOCALES) {
    const prefix = LOCALE_PREFIX[locale];
    if (!prefix) continue;
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      const rest = pathname.slice(prefix.length) || "/";
      return { locale, pathname: rest.startsWith("/") ? rest : `/${rest}` };
    }
  }
  return { locale: DEFAULT_LOCALE, pathname: pathname || "/" };
}

export function localizePath(href: string, locale: Locale): string {
  const prefix = LOCALE_PREFIX[locale];
  if (!prefix) return href;
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return href;
  if (href.startsWith("http://") || href.startsWith("https://")) return href;

  const hashAt = href.indexOf("#");
  const beforeHash = hashAt >= 0 ? href.slice(0, hashAt) : href;
  const hash = hashAt >= 0 ? href.slice(hashAt) : "";
  const queryAt = beforeHash.indexOf("?");
  const path = queryAt >= 0 ? beforeHash.slice(0, queryAt) : beforeHash;
  const query = queryAt >= 0 ? beforeHash.slice(queryAt) : "";

  if (!path.startsWith("/")) return href;
  if (path === prefix || path.startsWith(`${prefix}/`)) return href;
  if (UNPREFIXED.some((item) => path === item || path.startsWith(`${item}/`))) return href;

  const localized = path === "/" ? prefix : `${prefix}${path}`;
  return `${localized}${query}${hash}`;
}

export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ""));
}

export function writeLocaleCookie(locale: Locale): void {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}

export function writeSuggestCookie(value: "0" | "1"): void {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${SUGGEST_COOKIE}=${value}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}

export function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
