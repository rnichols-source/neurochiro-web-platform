import { getDoctorBySlug, incrementDoctorViews, getDoctorSeminars, getDoctorJobs, getCityDoctorCount, getNearbyDoctors, getCitySearchVolume } from "../actions";
import { notFound, permanentRedirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import DoctorProfileClient from "./DoctorProfileClient";
import { Metadata } from "next";
import SchemaMarkup from "@/components/seo/SchemaMarkup";
import { addressForSchema } from "@/lib/profile-display";
import { getApprovedStories } from "@/app/actions/patient-stories";

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

  const name = `Dr. ${doctor.first_name} ${doctor.last_name}`.replace(/\s+/g, " ").trim();
  const location = `${doctor.city}, ${doctor.state || doctor.country}`;
  const specialtyList = (doctor.specialties || []).slice(0, 3).join(", ");
  const profileUrl = `https://www.neurochiro.co/directory/${doctor.slug || doctor.id}`;
  
  const title = `${name} | Nervous System Specialist at ${doctor.clinic_name}`;
  const description = `Visit ${name} in ${location}. Specializing in ${specialtyList || 'Nervous System Chiropractic'}. Verified member of the NeuroChiro network of elite clinical practitioners.`;

  const ogImage = `https://www.neurochiro.co/api/og/profile?slug=${doctor.slug || doctor.id}&format=landscape`;

  return {
    title,
    description,
    alternates: {
      canonical: profileUrl,
    },
    keywords: doctor.seo_keywords ? doctor.seo_keywords.split(',').map((k: string) => k.trim()) : undefined,
    openGraph: {
      title,
      description,
      type: "profile",
      url: profileUrl,
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
    // Check for slug redirect (old slug → new slug)
    const supabase = createAdminClient();
    const { data: redir } = await (supabase as any)
      .from('slug_redirects')
      .select('new_slug')
      .eq('old_slug', resolvedParams.slug)
      .maybeSingle();
    if (redir?.new_slug) {
      permanentRedirect(`/directory/${redir.new_slug}`);
    }
    notFound();
  }

  const record = doctor as typeof doctor & {
    phone?: string | null;
    hours?: string | null;
    faq?: { question?: string; answer?: string }[] | null;
  };

  // 🛡️ Track View (Background)
  await incrementDoctorViews(resolvedParams.slug);

  // Fetch doctor's seminars, jobs, city data, and nearby doctors in parallel
  const [seminars, jobs, cityDoctorCount, nearbyDoctors, citySearchVolume, stories] = await Promise.all([
    doctor.user_id ? getDoctorSeminars(doctor.user_id) : Promise.resolve([]),
    getDoctorJobs(doctor.id),
    getCityDoctorCount(doctor.city || '', doctor.state || ''),
    getNearbyDoctors(doctor.id, doctor.state || '', 4, doctor.latitude, doctor.longitude),
    getCitySearchVolume(doctor.city || '', doctor.state || ''),
    getApprovedStories(doctor.id),
  ]);

  const profileUrl = `https://www.neurochiro.co/directory/${doctor.slug || doctor.id}`;
  const place = addressForSchema(doctor.address, doctor.city, doctor.state);
  const doctorName = `Dr. ${doctor.first_name} ${doctor.last_name}`.replace(/\s+/g, " ").trim();
  const faqItems = Array.isArray(record.faq)
    ? record.faq.filter((item) => item?.question && item?.answer)
    : [];

  // 2. JSON-LD STRUCTURED DATA (Physician & LocalBusiness)
  const jsonLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Physician",
    "name": doctorName,
    "url": profileUrl,
    "image": doctor.photo_url || "https://www.neurochiro.co/logo.png",
    "description": doctor.bio,
    "medicalSpecialty": doctor.specialties || ["Chiropractic"],
    "address": {
      "@type": "PostalAddress",
      "streetAddress": place.streetAddress,
      "addressLocality": place.locality || doctor.city,
      "addressRegion": place.region || doctor.state,
      "postalCode": place.postalCode,
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

  if (record.phone) jsonLd.telephone = record.phone;
  if (record.hours) jsonLd.openingHours = record.hours;
  if (doctor.latitude != null && doctor.longitude != null) {
    jsonLd.geo = {
      "@type": "GeoCoordinates",
      latitude: doctor.latitude,
      longitude: doctor.longitude,
    };
  }

  const faqLd = faqItems.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  } : null;

  return (
    <>
      <SchemaMarkup data={jsonLd} />
      {faqLd && <SchemaMarkup data={faqLd} />}
      <DoctorProfileClient doctor={doctor} slug={resolvedParams.slug} seminars={seminars} jobs={jobs} cityDoctorCount={cityDoctorCount} nearbyDoctors={nearbyDoctors} citySearchVolume={citySearchVolume} stories={stories} />
    </>
  );
}
