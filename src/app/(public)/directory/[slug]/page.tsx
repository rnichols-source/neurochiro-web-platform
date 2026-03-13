import { getDoctorBySlug, incrementDoctorViews } from "../actions";
import { notFound } from "next/navigation";
import DoctorProfileClient from "./DoctorProfileClient";
import { Metadata } from "next";
import SchemaMarkup from "@/components/seo/SchemaMarkup";

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

// 1. DYNAMIC SEO METADATA
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const { doctor } = await getDoctorBySlug(resolvedParams.slug);

  if (!doctor) {
    return {
      title: "Doctor Profile Not Found | NeuroChiro",
    };
  }

  const name = `${doctor.first_name} ${doctor.last_name}`;
  const location = `${doctor.city}, ${doctor.state || doctor.country}`;
  const title = `${name} | Nervous System Chiropractor in ${location}`;
  const description = `Connect with ${name}, a leading nervous system chiropractor at ${doctor.clinic_name} in ${location}. Specialist in Vagus Nerve health and neuro-centric chiropractic care.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [doctor.photo_url || "/logo.png"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [doctor.photo_url || "/logo.png"],
    },
  };
}

export default async function DoctorProfilePage({ params }: Props) {
  const resolvedParams = await params;
  const { doctor } = await getDoctorBySlug(resolvedParams.slug);

  if (!doctor) {
    notFound();
  }

  // 🛡️ Track View (Background)
  await incrementDoctorViews(resolvedParams.slug);

  // 2. JSON-LD STRUCTURED DATA (Physician & LocalBusiness)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Physician",
    "name": `${doctor.first_name} ${doctor.last_name}`,
    "image": doctor.photo_url || "https://neurochiro.com/logo.png",
    "description": doctor.bio,
    "medicalSpecialty": doctor.specialties || ["Chiropractic"],
    "address": {
      "@type": "PostalAddress",
      "addressLocality": doctor.city,
      "addressRegion": doctor.state,
      "addressCountry": doctor.country || "US"
    },
    "memberOf": {
      "@type": "Organization",
      "name": "NeuroChiro"
    },
    "provider": {
      "@type": "LocalBusiness",
      "name": doctor.clinic_name,
      "url": doctor.website_url
    }
  };

  return (
    <>
      <SchemaMarkup data={jsonLd} />
      <DoctorProfileClient doctor={doctor} slug={resolvedParams.slug} />
    </>
  );
}
