import { createClient } from 'next-sanity';

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
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
