import { Metadata } from "next";
import { languageAlternates, openGraphLocale } from "@/i18n/alternates";
import { getRequestDictionary } from "@/i18n/get-locale";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getRequestDictionary();
  return {
    title: t.meta.directoryLayoutTitle,
    description: t.meta.directoryLayoutDescription,
    alternates: languageAlternates("/directory", locale),
    openGraph: {
      title: t.meta.directoryOgTitle,
      description: t.meta.directoryOgDescription,
      images: ["/logo.png"],
      locale: openGraphLocale(locale),
    },
    twitter: {
      card: "summary_large_image",
      title: t.meta.directoryTwitterTitle,
      description: t.meta.directoryTwitterDescription,
      images: ["/logo.png"],
    },
  };
}

export default function DirectoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
