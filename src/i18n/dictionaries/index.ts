import type { Locale } from "../config";
import en, { type Dictionary } from "./en";
import fr from "./fr";

const dictionaries: Record<Locale, Dictionary> = { en, fr };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? en;
}

export type { Dictionary };
