import { getDoctors } from "../../actions";
import DirectoryContent from "../../DirectoryContent";
import { REGIONS, RegionCode } from "@/lib/regions";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import SchemaMarkup from "@/components/seo/SchemaMarkup";
import { fill } from "@/i18n/config";
import { languageAlternates } from "@/i18n/alternates";
import { countryName } from "@/i18n/countries";
import { getRequestDictionary } from "@/i18n/get-locale";

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ region: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region: regionSlug } = await params;
  const regionKey = regionSlug.toUpperCase() as RegionCode;
  const region = REGIONS[regionKey];
  const { locale, t } = await getRequestDictionary();

  if (!region) {
    return {
      title: t.meta.regionMissing,
    };
  }

  const label = countryName(region.code, locale, region.label);
  const title = fill(t.directory.regionTitle, { label });
  const description = fill(t.directory.regionDescription, { label });

  return {
    title,
    description,
    alternates: languageAlternates(`/directory/locations/${regionSlug}`, locale),
    openGraph: {
      title,
      description,
      images: ["/logo.png"],
    },
  };
}

export default async function RegionalDirectoryPage({ params }: Props) {
  const { region: regionSlug } = await params;
  const regionKey = regionSlug.toUpperCase() as RegionCode;
  const region = REGIONS[regionKey];

  if (!region) {
    notFound();
  }

  const { locale, t } = await getRequestDictionary();
  const label = countryName(region.code, locale, region.label);
  const initialData = await getDoctors({ regionCode: regionKey, limit: 100 });

  // JSON-LD for the Regional Directory (ItemList or FAQPage)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": fill(t.directory.regionListName, { label }),
    "description": fill(t.directory.regionListDescription, { label }),
    "itemListElement": initialData.doctors.map((doc, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Physician",
        "name": `${doc.first_name} ${doc.last_name}`,
        "image": doc.photo_url || "https://www.neurochiro.co/logo.png",
        "url": `https://www.neurochiro.co/directory/${doc.slug || doc.id}`,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": doc.city,
          "addressRegion": doc.state,
          "addressCountry": doc.country
        }
      }
    }))
  };

  return (
    <>
      <SchemaMarkup data={jsonLd} />
      <DirectoryContent initialData={initialData} forcedRegion={regionKey} />
    </>
  );
}
