'use server';

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

const NEW_DOCTORS = [
  {
    first_name: 'Adam',
    last_name: 'Ardoin',
    clinic_name: 'Liberated Chiropractic',
    address: '4100 Heritage Ave Ste 101',
    city: 'Grapevine',
    state: 'Texas',
    country: 'United States',
    zip_code: '76051',
    phone: '',
    email: '',
    website_url: 'https://liberatedchiropractic.com',
    instagram_url: 'https://instagram.com/dradamardoin',
    booking_url: 'https://liberatedchiropractic.janeapp.com',
    bio: 'Dr. Adam Ardoin is a neurologically-focused chiropractor specializing in pediatric and prenatal care at Liberated Chiropractic in Grapevine, Texas. A graduate of Parker University with a Doctorate of Chiropractic, he helps families break free from cycles of stress, meltdowns, and sleepless nights by addressing the root cause — the nervous system.',
    specialties: ['Pediatric', 'Prenatal', 'Family', 'Neurologically-Focused'],
    verification_status: 'verified',
    membership_tier: 'free',
    region_code: 'US',
    accepting_new_patients: true,
    slug: 'dr-adam-ardoin-grapevine-tx',
    latitude: 32.9343,
    longitude: -97.0781,
  },
  {
    first_name: 'Shanna',
    last_name: 'Jackson',
    clinic_name: 'Rise Up Chiropractic',
    address: '2951 FM 1460 Unit 1402',
    city: 'Georgetown',
    state: 'Texas',
    country: 'United States',
    zip_code: '78626',
    phone: '',
    email: '',
    website_url: 'https://riseupchirotx.com',
    instagram_url: 'https://instagram.com/drshannaj',
    booking_url: '',
    bio: 'Dr. Shanna Jackson is an upper cervical chiropractor at Rise Up Chiropractic in Georgetown, Texas. With nearly a decade of experience, she uses Orthospinology and Toggle Recoil techniques to precisely realign the atlas and reduce brainstem stress. She is passionate about empowering women to live vibrant, healthy, and fulfilling lives.',
    specialties: ['Upper Cervical', 'Orthospinology', 'Women\'s Health', 'Migraine', 'TMJ'],
    verification_status: 'verified',
    membership_tier: 'free',
    region_code: 'US',
    accepting_new_patients: true,
    slug: 'dr-shanna-jackson-georgetown-tx',
    latitude: 30.6333,
    longitude: -97.6770,
  },
  {
    first_name: 'Carter',
    last_name: 'Gwynne',
    clinic_name: 'Wavelength Chiropractic',
    address: '12239 Queenston Blvd #F',
    city: 'Cypress',
    state: 'Texas',
    country: 'United States',
    zip_code: '77095',
    phone: '(281) 225-0127',
    email: '',
    website_url: 'https://wavelengthchiropractic.com',
    instagram_url: 'https://instagram.com/wavelengthchiro_cypresstx',
    facebook_url: 'https://facebook.com/61564386043765',
    booking_url: '',
    bio: 'Dr. Carter Gwynne provides neurologically-focused chiropractic care at Wavelength Chiropractic in Cypress, Texas. His approach centers on giving your body back the power to heal itself through specific and intentional adjustments. He specializes in care for the whole family including pediatric, pregnancy, and auto injury recovery.',
    specialties: ['Neurologically-Focused', 'Pediatric', 'Prenatal', 'Auto Injury', 'Family'],
    verification_status: 'verified',
    membership_tier: 'free',
    region_code: 'US',
    accepting_new_patients: true,
    slug: 'dr-carter-gwynne-cypress-tx',
    latitude: 29.9622,
    longitude: -95.6970,
  },
  {
    first_name: 'Tanner',
    last_name: 'DeBettencourt',
    clinic_name: 'Roots Chiropractic & Wellness',
    address: '3255 N Major Dr Ste F',
    city: 'Beaumont',
    state: 'Texas',
    country: 'United States',
    zip_code: '77713',
    phone: '(409) 333-1039',
    email: '',
    website_url: 'https://rootschirobmt.com',
    instagram_url: 'https://instagram.com/rootschirobmt',
    booking_url: 'https://rootschirobmt.com/appointment-scheduling',
    bio: 'Dr. Tanner DeBettencourt provides care rooted in faith, purpose, and a deep respect for the body\'s natural design at Roots Chiropractic & Wellness in Beaumont, Texas. Specializing in preventative chiropractic and red light therapy, he helps Southeast Texas move better through personalized wellness care.',
    specialties: ['Chiropractic', 'Red Light Therapy', 'Wellness', 'Family'],
    verification_status: 'verified',
    membership_tier: 'free',
    region_code: 'US',
    accepting_new_patients: true,
    slug: 'dr-tanner-debettencourt-beaumont-tx',
    latitude: 30.1288,
    longitude: -94.1543,
  },
];

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const results: any[] = [];

  for (const doc of NEW_DOCTORS) {
    // Check if doctor already exists by slug
    const { data: existing } = await supabase
      .from('doctors')
      .select('id, slug')
      .eq('slug', doc.slug)
      .maybeSingle();

    if (existing) {
      results.push({ name: `Dr. ${doc.first_name} ${doc.last_name}`, status: 'already_exists', id: existing.id });
      continue;
    }

    // Also check by name + city
    const { data: nameMatch } = await supabase
      .from('doctors')
      .select('id')
      .ilike('first_name', doc.first_name)
      .ilike('last_name', doc.last_name)
      .ilike('city', doc.city)
      .maybeSingle();

    if (nameMatch) {
      results.push({ name: `Dr. ${doc.first_name} ${doc.last_name}`, status: 'already_exists_by_name', id: nameMatch.id });
      continue;
    }

    const { data: inserted, error } = await supabase
      .from('doctors')
      .insert(doc)
      .select('id, slug')
      .single();

    if (error) {
      results.push({ name: `Dr. ${doc.first_name} ${doc.last_name}`, status: 'error', error: error.message });
    } else {
      results.push({ name: `Dr. ${doc.first_name} ${doc.last_name}`, status: 'created', id: inserted.id, slug: inserted.slug });
    }
  }

  return NextResponse.json({ results });
}
