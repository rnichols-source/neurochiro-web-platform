import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import * as dotenv from 'dotenv';

// Load .env from project root
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const CSV_PATH = path.resolve(process.cwd(), '../Downloads/Chiropractors-Grid view.csv');

const unpaidNames = [
  'Ronnie Bolar', 'Stanton Hom', 'Todd Countee', 'Zachary Soufl', 
  'Jake Schumann', 'Kyle Rodriguez', 'Malory Tinsley', 'Mickey Mondragon', 
  "Keith's Garavito", 'KenGee Ehrlich', 'Kevin LeBlanc', 'Kurtis Fischer', 
  "Kyle Deon's", 'Maggie Benham', 'Megan Gomez', 'Preston Cook', 
  'Brooke Galbiati', 'Elle Klink', 'James Huang', 'New Zealand one', 
  'Blain segura', 'Chandler Boggs', 'Canaan Andrews', 'Alexis Taylor', 
  'Ashley Trueblood', 'Breanna Rodriguez', 'Amy Anthony'
].map(n => n.toLowerCase());

async function seed() {
  console.log("🚀 STARTING MASS SEEDING OF DIRECTORY...");
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const fileContent = fs.readFileSync(CSV_PATH, 'utf-8');
  
  const records = parse(fileContent, {
    columns: (header: string[]) => header.map(h => h.trim().replace(/^\uFEFF/, '')),
    skip_empty_lines: true,
    relax_column_count: true,
    relax_quotes: true,
    quote: '"',
    escape: '"',
    ltrim: true,
    rtrim: true
  }) as any[];

  console.log(`📊 Found ${records.length} doctors in CSV.`);

  const doctorsToInsert = records.map(r => {
    const fullName = r['Full Name'] || "";
    const isUnpaid = unpaidNames.some(un => fullName.toLowerCase().includes(un));
    
    // Clean name
    const nameParts = fullName.replace('Dr. ', '').split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    return {
      first_name: firstName,
      last_name: lastName,
      clinic_name: r['Practice Name'] || "NeuroChiro Clinic",
      city: r['City'] || "",
      state: r['State'] || "",
      country: r['Country'] || "United States",
      address: r['Address'] || "",
      latitude: parseFloat(r['Latitude']) || 0,
      longitude: parseFloat(r['Longitude']) || 0,
      website_url: r['Website URL'] || "",
      instagram_url: r['Instagram'] || "",
      facebook_url: r['Facebook'] || "",
      bio: r['Testimonials Summary'] || "",
      specialties: [r['Practice Focus'] || 'General NeuroChiro'],
      verification_status: isUnpaid ? 'hidden' : 'verified',
      membership_tier: 'starter',
      region_code: r['Country'] === 'United States' ? 'US' : 'AU', // fallback logic
      slug: (fullName.toLowerCase().replace(/\s+/g, '-') || 'dr-' + Math.random().toString(36).substring(7))
    };
  });

  // Batch insert
  console.log(`⏳ Inserting ${doctorsToInsert.length} records into Supabase...`);
  
  // We'll do it in batches of 50 to avoid payload limits
  for (let i = 0; i < doctorsToInsert.length; i += 50) {
    const batch = doctorsToInsert.slice(i, i + 50);
    const { error } = await supabase.from('doctors').upsert(batch, { onConflict: 'slug' });
    if (error) {
      console.error(`❌ Error inserting batch ${i / 50 + 1}:`, error.message);
    } else {
      console.log(`✅ Batch ${i / 50 + 1} complete.`);
    }
  }

  console.log("🎉 SEEDING COMPLETE. Directory is now live.");
}

seed();
