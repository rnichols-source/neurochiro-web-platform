import type { Metadata } from "next";
import { languageAlternates } from "@/i18n/alternates";
import { getRequestDictionary } from "@/i18n/get-locale";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getRequestDictionary();
  return {
    title: t.meta.contactTitle,
    description: t.meta.contactDescription,
    alternates: languageAlternates("/contact", locale),
  };
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
