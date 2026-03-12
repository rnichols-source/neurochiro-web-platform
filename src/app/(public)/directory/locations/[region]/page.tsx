import { getDoctors } from "../../actions";
import DirectoryContent from "../../DirectoryContent";
import { REGIONS, RegionCode } from "@/lib/regions";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import SchemaMarkup from "@/components/seo/SchemaMarkup";

export const dynamic = 'force-dynamic';

interface Props {
  params: { region: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const regionKey = params.region.toUpperCase() as RegionCode;
  const region = REGIONS[regionKey];

  if (!region) {
    return {
      title: "Region Not Found | NeuroChiro",
    };
  }

  const title = `Top Nervous System Chiropractors in ${region.label} | NeuroChiro Directory`;
  const description = `Find and connect with the best nervous-system-focused chiropractors in ${region.label}. Verified NeuroChiro providers specializing in Vagus Nerve health and neuro-centric care.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ["/logo.png"],
    },
  };
}

export default async function RegionalDirectoryPage({ params }: Props) {
  const regionKey = params.region.toUpperCase() as RegionCode;
  const region = REGIONS[regionKey];

  if (!region) {
    notFound();
  }

  const initialData = await getDoctors({ regionCode: regionKey, limit: 100 });

  // JSON-LD for the Regional Directory (ItemList or FAQPage)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Nervous System Chiropractors in ${region.label}`,
    "description": `List of verified NeuroChiro providers in ${region.label}`,
    "itemListElement": initialData.doctors.map((doc, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Physician",
        "name": `${doc.first_name} ${doc.last_name}`,
        "image": doc.photo_url || "https://neurochiro.com/logo.png",
        "url": `https://neurochiro.com/directory/${doc.slug}`,
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
      <DirectoryContent initialData={initialData} />
    </>
  );
}
