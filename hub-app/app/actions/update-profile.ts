'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@sanity/client';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: 'production',
  token: process.env.SANITY_API_WRITE_TOKEN, // Requires write access
  useCdn: false,
});

export async function updateDoctorProfile(formData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const doctorId = formData.get('doctorId');
  const clinicName = formData.get('clinicName');
  const bio = formData.get('bio');
  const phone = formData.get('phone');

  // CRITICAL: Secure Ownership Check
  const doctor = await client.fetch(`*[_type == "doctor" && _id == $id][0]`, { id: doctorId });
  
  if (!doctor || doctor.clerkId !== userId) {
    throw new Error("Forbidden: You do not have permission to edit this profile.");
  }

  return await client.patch(doctorId).set({
    clinicName,
    bio,
    phone,
  }).commit();
}
