"use client";

import Link from "next/link";
import { localizePath } from "./config";
import { useLocale } from "./locale-context";

type Props = React.ComponentProps<typeof Link>;

/** next/link that keeps the patient on /fr/... once they have chosen French. */
export function LocaleLink({ href, ...props }: Props) {
  const locale = useLocale();
  const localized = typeof href === "string" ? localizePath(href, locale) : href;
  return <Link href={localized} {...props} />;
}
