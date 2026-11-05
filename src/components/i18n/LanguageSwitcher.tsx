"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { localizePath, splitLocalePrefix, writeLocaleCookie, type Locale } from "@/i18n/config";
import { useDictionary, useLocale } from "@/i18n/locale-context";

export default function LanguageSwitcher({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const locale = useLocale();
  const t = useDictionary();
  const pathname = usePathname() || "/";
  const search = useSearchParams();
  const bare = splitLocalePrefix(pathname).pathname;
  const query = search?.toString();
  const bareHref = query ? `${bare}?${query}` : bare;
  const enHref = bareHref;
  const frHref = localizePath(bareHref, "fr");

  const choose = (next: Locale) => {
    writeLocaleCookie(next);
  };

  const item = (code: Locale, href: string, label: string) => {
    const active = locale === code;
    const dark = tone === "dark";
    return (
      <a
        href={href}
        hrefLang={code}
        lang={code}
        aria-current={active ? "true" : undefined}
        onClick={() => choose(code)}
        className={`inline-flex h-9 items-center rounded-full px-2.5 text-xs font-bold ${
          active
            ? "bg-neuro-orange-ink text-white"
            : dark
              ? "text-white/80 hover:text-white"
              : "text-neuro-navy hover:text-neuro-orange-ink"
        }`}
      >
        {label}
      </a>
    );
  };

  return (
    <nav
      aria-label={t.switcher.label}
      className={`inline-flex items-center rounded-full p-0.5 ${tone === "dark" ? "bg-white/10" : "bg-neuro-cream"}`}
    >
      {item("en", enHref, t.switcher.english)}
      {item("fr", frHref, t.switcher.french)}
    </nav>
  );
}
