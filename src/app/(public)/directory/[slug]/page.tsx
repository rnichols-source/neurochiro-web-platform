import { getDoctorBySlug, incrementDoctorViews } from "../actions";
import { notFound } from "next/navigation";
import DoctorProfileClient from "./DoctorProfileClient";
import { Metadata } from "next";
import SchemaMarkup from "@/components/seo/SchemaMarkup";

export const revalidate = 60; // ISR: cache for 60 seconds

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
  const specialtyList = (doctor.specialties || []).slice(0, 3).join(", ");
  
  const title = `${name} | Nervous System Specialist at ${doctor.clinic_name}`;
  const description = `Visit ${name} in ${location}. Specializing in ${specialtyList || 'Nervous System Chiropractic'}. Verified member of the NeuroChiro network of elite clinical practitioners.`;

  const ogImage = doctor.photo_url || "https://neurochiro.co/og-default.png";

  return {
    title,
    description,
    keywords: doctor.seo_keywords ? doctor.seo_keywords.split(',').map((k: string) => k.trim()) : undefined,
    openGraph: {
      title,
      description,
      type: "profile",
      url: `https://neurochiro.co/directory/${doctor.slug || doctor.id}`,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${name} - ${doctor.clinic_name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
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
