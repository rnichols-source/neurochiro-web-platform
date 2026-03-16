const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function repair() {
  console.log("Starting Global Location Precision Repair...");
  
  const { data: doctors, error } = await supabase
    .from('doctors')
    .select('id, first_name, last_name, city, state, country, latitude, longitude');

  if (error) {
    console.error("Failed to fetch doctors:", error);
    return;
  }

  console.log(`Found ${doctors.length} doctors. Beginning geocoding...`);
  
  const log = [];

  for (const doc of doctors) {
    let city = doc.city || "";
    let state = doc.state || "";
    let country = doc.country || "United States";

    // 1. Smart Parsing: Handle "Naples, FL" in city field
    if (!state && city.includes(',')) {
      const parts = city.split(',').map(p => p.trim());
      city = parts[0];
      state = parts[1];
    }

    const searchQuery = [city, state, country].filter(Boolean).join(', ');
    
    try {
      // Respect Nominatim usage policy (1 request per second)
      await sleep(1000);
      
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`, {
        headers: { 'User-Agent': 'NeuroChiroRepairScript/1.0' }
      });
      const data = await response.json();

      if (data && data.length > 0) {
        const newLat = parseFloat(data[0].lat);
        const newLng = parseFloat(data[0].lon);

        // Check if coordinates significantly changed or were zero
        const dist = Math.sqrt(Math.pow(newLat - (doc.latitude || 0), 2) + Math.pow(newLng - (doc.longitude || 0), 2));
        
        if (dist > 0.01 || !doc.latitude) {
          const { error: updateError } = await supabase
            .from('doctors')
            .update({
              latitude: newLat,
              longitude: newLng,
              city: city,
              state: state || null,
              country: country
            })
            .eq('id', doc.id);

          if (updateError) {
            console.error(`Error updating ${doc.first_name} ${doc.last_name}:`, updateError);
          } else {
            const entry = `✅ REPAIRED: Dr. ${doc.first_name} ${doc.last_name} -> ${searchQuery} (Dist: ${dist.toFixed(4)})`;
            console.log(entry);
            log.push(entry);
          }
        } else {
          console.log(`- OK: Dr. ${doc.first_name} ${doc.last_name} location accurate.`);
        }
      } else {
        console.warn(`⚠️ NOT FOUND: ${searchQuery} for Dr. ${doc.first_name} ${doc.last_name}`);
      }
    } catch (e) {
      console.error(`❌ FAILED: ${doc.first_name} ${doc.last_name}`, e.message);
    }
  }

  console.log("\n--- REPAIR LOG SUMMARY ---");
  console.log(log.join('\n'));
  console.log(`\nTotal Repaired: ${log.length}`);
}

repair();
