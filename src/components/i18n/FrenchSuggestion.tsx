"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { localizePath, LOCALE_COOKIE, readCookie, splitLocalePrefix, SUGGEST_COOKIE, writeLocaleCookie, writeSuggestCookie } from "@/i18n/config";
import { useDictionary, useLocale } from "@/i18n/locale-context";

export default function FrenchSuggestion() {
  const locale = useLocale();
  const t = useDictionary();
  const pathname = usePathname() || "/";
  const search = useSearchParams();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (locale !== "en") return;
    if (readCookie(SUGGEST_COOKIE) === "0") return;
    const chosen = readCookie(LOCALE_COOKIE);
    if (chosen === "en") return;
    const browserFrench = typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("fr");
    if (chosen === "fr" || browserFrench) setOpen(true);
  }, [locale]);

  if (!open) return null;

  const bare = splitLocalePrefix(pathname).pathname;
  const query = search?.toString();
  const href = localizePath(query ? `${bare}?${query}` : bare, "fr");
  const onDirectory = bare === "/directory";

  return (
    <div
      role="region"
      aria-label={t.switcher.label}
      className={`fixed inset-x-3 z-[140] mx-auto flex max-w-lg flex-col gap-3 rounded-2xl border border-white/10 bg-neuro-navy p-4 text-white shadow-2xl sm:flex-row sm:items-center ${
        onDirectory ? "bottom-24" : "bottom-4"
      }`}
    >
      <p className="flex-1 text-sm leading-snug">{t.suggest.body}</p>
      <div className="flex gap-2">
        <a
          href={href}
          hrefLang="fr"
          lang="fr"
          onClick={() => writeLocaleCookie("fr")}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-neuro-orange-ink px-4 text-sm font-bold text-white"
        >
          {t.suggest.accept}
        </a>
        <button
          type="button"
          onClick={() => {
            writeSuggestCookie("0");
            setOpen(false);
          }}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-white/10 px-4 text-sm font-bold"
        >
          {t.suggest.dismiss}
        </button>
      </div>
    </div>
  );
}
