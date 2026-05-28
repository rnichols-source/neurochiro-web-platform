/**
 * Seed a fully complete doctor profile to preview all profile features.
 *
 * Usage:  npx tsx scripts/seed-complete-profile.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seed() {
  const slug = 'dr-sophia-chen-demo';

  // Check if already exists
  const { data: existing } = await admin
    .from('doctors')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (existing) {
    console.log(`Doctor "${slug}" already exists (id: ${existing.id}). Updating...`);
  }

  const doctor = {
    slug,
    first_name: 'Sophia',
    last_name: 'Chen',
    clinic_name: 'NeuroVital Chiropractic & Wellness',
    city: 'Austin',
    state: 'Texas',
    address: '401 Congress Ave, Suite 1200',
    latitude: 30.2672,
    longitude: -97.7431,
    region_code: 'US',

    // Contact
    email: 'drsophia@neurovitalchiro.com',
    phone: '(512) 555-0188',
    website_url: 'https://neurovitalchiro.com',
    instagram_url: 'https://instagram.com/drsophiachen',
    facebook_url: 'https://facebook.com/neurovitalchiro',
    booking_url: 'https://neurovitalchiro.com/book',

    // Media
    photo_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80',
    banner_url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1600&q=80',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    gallery_images: [
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80',
    ],

    // Bio
    bio: `Every patient who walks through our doors has a story — and their nervous system tells the most important chapter. At NeuroVital, we don't just adjust spines. We decode the signals your brain is sending, find where the communication breaks down, and restore the connection that lets your body heal itself.

After 18 years and over 12,000 patients, I've seen children who couldn't focus suddenly thrive in school, athletes who were told they'd never compete again return to the field, and families who thought they'd tried everything finally find answers. The nervous system is the master controller — when it works, everything works.

Our approach combines functional neurology with advanced diagnostic imaging, heart rate variability analysis, and personalized corrective protocols. We don't guess — we test, measure, and track every milestone. Your care plan is as unique as your fingerprint.

If you're looking for a chiropractor who treats the whole person, not just the symptom, you've found the right practice.`,

    // Specialties & Conditions
    specialties: [
      'Functional Neurology',
      'Pediatric Chiropractic',
      'Sports Performance',
      'Prenatal / Webster Technique',
      'Concussion Recovery',
      'ADHD & Sensory Processing',
    ],
    conditions_treated: [
      'Migraines & Headaches',
      'Chronic Back Pain',
      'Vertigo & Dizziness',
      'Sciatica',
      'Neck Pain',
      'TMJ / Jaw Pain',
      'Anxiety & Stress',
      'Infant Colic',
      'Ear Infections',
      'Pregnancy Discomfort',
      'Post-Concussion Syndrome',
      'ADHD & Focus Issues',
    ],

    // Credentials
    certifications: [
      'Diplomate — American Chiropractic Neurology Board (DACNB)',
      'Webster Technique Certified',
      'Advanced Proficiency in Torque Release Technique',
      'Certified Pediatric Chiropractor (ICPA)',
      'Functional Medicine Practitioner',
    ],
    education: [
      'Doctor of Chiropractic — Palmer College of Chiropractic, 2008',
      'B.S. Kinesiology — University of Texas at Austin, 2004',
      'Post-Doctoral Fellowship — Carrick Institute for Clinical Neuroscience',
    ],

    // Highlights
    highlights: [
      '12,000+ patients helped since 2008',
      'Advanced nervous system scanning technology',
      'Voted Best Chiropractor in Austin 2024 & 2025',
      'Family-friendly — we see newborns through grandparents',
      'Same-day emergency appointments available',
      'Free 15-minute phone consultation for new patients',
    ],

    // Practical Info
    hours: 'Monday: 8:00 AM – 6:00 PM\nTuesday: 8:00 AM – 6:00 PM\nWednesday: 8:00 AM – 12:00 PM\nThursday: 8:00 AM – 6:00 PM\nFriday: 8:00 AM – 4:00 PM\nSaturday: 9:00 AM – 1:00 PM\nSunday: Closed',
    first_visit_info: `Your first visit takes about 60 minutes. Here's what to expect:

1. Comprehensive Health History — We'll review your history, lifestyle, and goals in detail.
2. Nervous System Scan — Using CLA INSiGHT technology, we'll map your nervous system function with surface EMG, thermal scanning, and heart rate variability.
3. Digital X-Rays — If clinically necessary, we'll take targeted images to understand your spinal structure.
4. Doctor's Report — Dr. Chen will walk you through every finding, explain what's happening, and present your personalized care plan.

Please wear comfortable clothing and arrive 10 minutes early to complete paperwork (or fill it out online beforehand). Bring any prior imaging or medical records if available.`,
    parking_info: 'Free underground parking — enter from 4th Street. Validated parking stickers available at front desk. Wheelchair accessible entrance on Congress Ave.',
    amenities: [
      'Free WiFi',
      'Wheelchair Accessible',
      'Children\'s Play Area',
      'Complimentary Coffee & Tea',
      'Private Adjustment Rooms',
      'On-Site Digital X-Ray',
      'CLA INSiGHT Scanning',
      'Electric Vehicle Charging',
    ],
    languages: ['English', 'Mandarin', 'Spanish'],
    accepted_payment: ['Cash', 'Credit Card', 'Debit Card', 'HSA/FSA', 'CareCredit'],
    insurance_networks: [
      'Blue Cross Blue Shield',
      'Aetna',
      'UnitedHealthcare',
      'Cigna',
      'Humana',
      'Medicare',
    ],

    // Flags
    offers_telehealth: true,
    accepts_walkins: true,
    accepting_new_patients: true,
    is_founding_member: true,
    years_in_practice: 18,

    // Team
    team_members: [
      { name: 'Dr. Sophia Chen', role: 'Founder & Lead Clinician', photo_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=200&q=80' },
      { name: 'Dr. Marcus Rivera', role: 'Associate Chiropractor', photo_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&q=80' },
      { name: 'Jamie Okafor', role: 'Chiropractic Assistant', photo_url: 'https://images.unsplash.com/photo-1594824476967-48c8b964d8c0?auto=format&fit=crop&w=200&q=80' },
      { name: 'Lisa Park', role: 'Front Desk & Patient Coordinator', photo_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80' },
    ],

    // FAQ
    faq: [
      { question: 'Do I need a referral to see a chiropractor?', answer: 'No referral is needed. You can book directly with us. If your insurance requires one, we can help coordinate that.' },
      { question: 'Is chiropractic care safe for children?', answer: 'Absolutely. Pediatric adjustments use extremely gentle pressure — about the same as you\'d use to test a ripe tomato. We\'ve cared for thousands of children, including newborns.' },
      { question: 'How many visits will I need?', answer: 'Every patient is different. After your initial assessment, Dr. Chen will recommend a personalized care plan. Some patients see improvement in 2-3 visits; complex cases may require ongoing care.' },
      { question: 'What\'s the difference between you and a regular chiropractor?', answer: 'We specialize in functional neurology — we don\'t just look at where it hurts, we assess how your entire nervous system is functioning. Our scanning technology gives us objective data that guides every adjustment.' },
      { question: 'Do you accept insurance?', answer: 'Yes, we accept most major insurance plans including BCBS, Aetna, UnitedHealthcare, Cigna, Humana, and Medicare. We also accept HSA/FSA cards and offer CareCredit financing.' },
    ],

    // SEO
    seo_keywords: 'chiropractor austin, functional neurology austin, pediatric chiropractor austin, sports chiropractor texas, nervous system specialist, concussion recovery chiropractor',

    // Status
    verification_status: 'verified',
    membership_tier: 'pro',
    profile_views: 2847,
    patient_leads: 163,
  };

  let result;
  if (existing) {
    result = await admin.from('doctors').update(doctor).eq('id', existing.id).select('id, slug').single();
  } else {
    result = await admin.from('doctors').insert([doctor]).select('id, slug').single();
  }

  if (result.error) {
    console.error('Error:', result.error.message);
    console.error('Details:', result.error.details);
    process.exit(1);
  }

  console.log('\n✅ Fully loaded demo profile created!\n');
  console.log(`   Name:  Dr. Sophia Chen`);
  console.log(`   Slug:  ${result.data?.slug}`);
  console.log(`   ID:    ${result.data?.id}`);
  console.log(`\n   View:  http://localhost:3000/directory/${result.data?.slug}`);
  console.log(`   Live:  https://neurochiro.co/directory/${result.data?.slug}\n`);
}

seed();
