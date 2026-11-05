import "server-only";
import { headers } from "next/headers";
import { isLocale, LOCALE_HEADER, type Locale } from "./config";
import { getDictionary } from "./dictionaries";

export async function getLocale(): Promise<Locale> {
  const headerStore = await headers();
  const value = headerStore.get(LOCALE_HEADER);
  return isLocale(value) ? value : "en";
}

export async function getRequestDictionary() {
  const locale = await getLocale();
  return { locale, t: getDictionary(locale) };
}
