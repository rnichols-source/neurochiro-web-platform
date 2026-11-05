import type { Locale } from "./config";

/** Display names for the country switcher. Unknown codes keep the English label from data. */
const FRENCH_COUNTRIES: Record<string, string> = {
  US: "États-Unis",
  CA: "Canada",
  UK: "Royaume-Uni",
  GB: "Royaume-Uni",
  AU: "Australie",
  NZ: "Nouvelle-Zélande",
  EU: "Europe",
  ALL: "Monde",
  FR: "France",
  DE: "Allemagne",
  IE: "Irlande",
  NL: "Pays-Bas",
  IT: "Italie",
  ES: "Espagne",
};

export function countryName(code: string, locale: Locale, fallback: string): string {
  if (locale !== "fr") return fallback;
  return FRENCH_COUNTRIES[code] || fallback;
}
