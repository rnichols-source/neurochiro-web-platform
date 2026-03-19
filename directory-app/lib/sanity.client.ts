import { createClient } from 'next-sanity';

if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
  console.warn("Sanity Project ID is missing. Content may not load.");
}

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'dummy-id',
  dataset: 'production',
  apiVersion: '2025-03-18', // Use today's date or your project's API version
  useCdn: true,
});

export const getDoctorsQuery = `*[_type == "doctor"]{
  _id,
  name,
  specialty,
  "lat": location.lat,
  "lng": location.lng,
  isClaimed
}`;
