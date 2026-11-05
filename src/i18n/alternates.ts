import type { Metadata } from "next";
import type { Locale } from "./config";

export const SITE_ORIGIN = "https://www.neurochiro.co";

export function publicUrl(barePath: string, locale: Locale): string {
  const path = barePath.startsWith("/") ? barePath : `/${barePath}`;
  if (locale === "fr") {
    return path === "/" ? `${SITE_ORIGIN}/fr` : `${SITE_ORIGIN}/fr${path}`;
  }
  return path === "/" ? SITE_ORIGIN : `${SITE_ORIGIN}${path}`;
}

export function languageAlternates(barePath: string, locale: Locale): NonNullable<Metadata["alternates"]> {
  return {
    canonical: publicUrl(barePath, locale),
    languages: {
      en: publicUrl(barePath, "en"),
      fr: publicUrl(barePath, "fr"),
      "x-default": publicUrl(barePath, "en"),
    },
  };
}

export function openGraphLocale(locale: Locale): string {
  return locale === "fr" ? "fr_FR" : "en_US";
}
