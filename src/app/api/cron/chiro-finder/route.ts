import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { wrapEmail } from '@/lib/email-template';

export const maxDuration = 300;

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const SERPAPI_KEY = process.env.SERPAPI_KEY || 'f31e69bc5e63289df5d58b401940d838d5c76608f971728da4f59913d7971553';

// States and their major cities to search
const STATE_CITIES: Record<string, string[]> = {
  'Alabama': ['Birmingham', 'Huntsville', 'Mobile', 'Montgomery', 'Tuscaloosa'],
  'Alaska': ['Anchorage', 'Fairbanks', 'Juneau'],
  'Arizona': ['Phoenix', 'Tucson', 'Scottsdale', 'Mesa', 'Chandler'],
  'Arkansas': ['Little Rock', 'Fayetteville', 'Fort Smith', 'Jonesboro'],
  'California': ['Los Angeles', 'San Diego', 'San Francisco', 'Sacramento', 'San Jose'],
  'Colorado': ['Denver', 'Colorado Springs', 'Aurora', 'Boulder', 'Fort Collins'],
  'Connecticut': ['Hartford', 'New Haven', 'Stamford', 'Bridgeport'],
  'Delaware': ['Wilmington', 'Dover', 'Newark'],
  'Florida': ['Jacksonville', 'Tampa', 'Orlando', 'Miami', 'Sarasota'],
  'Georgia': ['Atlanta', 'Savannah', 'Augusta', 'Marietta', 'Athens'],
  'Hawaii': ['Honolulu', 'Maui', 'Kailua'],
  'Idaho': ['Boise', 'Meridian', 'Nampa'],
  'Illinois': ['Chicago', 'Naperville', 'Rockford', 'Springfield'],
  'Indiana': ['Indianapolis', 'Fort Wayne', 'Carmel', 'Fishers'],
  'Iowa': ['Des Moines', 'Cedar Rapids', 'Davenport', 'Iowa City'],
  'Kansas': ['Wichita', 'Overland Park', 'Kansas City', 'Topeka'],
  'Kentucky': ['Louisville', 'Lexington', 'Bowling Green', 'Covington'],
  'Louisiana': ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette'],
  'Maine': ['Portland', 'Bangor', 'Lewiston'],
  'Maryland': ['Baltimore', 'Bethesda', 'Rockville', 'Annapolis'],
  'Massachusetts': ['Boston', 'Cambridge', 'Worcester', 'Springfield'],
  'Michigan': ['Detroit', 'Grand Rapids', 'Ann Arbor', 'Lansing'],
  'Minnesota': ['Minneapolis', 'St Paul', 'Rochester', 'Duluth'],
  'Mississippi': ['Jackson', 'Gulfport', 'Hattiesburg', 'Tupelo'],
  'Missouri': ['Kansas City', 'St Louis', 'Springfield', 'Columbia'],
  'Montana': ['Billings', 'Missoula', 'Great Falls'],
  'Nebraska': ['Omaha', 'Lincoln', 'Bellevue'],
  'Nevada': ['Las Vegas', 'Reno', 'Henderson'],
  'New Hampshire': ['Manchester', 'Nashua', 'Concord'],
  'New Jersey': ['Newark', 'Jersey City', 'Princeton', 'Morristown'],
  'New Mexico': ['Albuquerque', 'Santa Fe', 'Las Cruces'],
  'New York': ['New York City', 'Buffalo', 'Rochester', 'Albany'],
  'North Carolina': ['Charlotte', 'Raleigh', 'Asheville', 'Durham', 'Greensboro'],
  'North Dakota': ['Fargo', 'Bismarck', 'Grand Forks'],
  'Ohio': ['Columbus', 'Cleveland', 'Cincinnati', 'Dayton'],
  'Oklahoma': ['Oklahoma City', 'Tulsa', 'Norman', 'Edmond'],
  'Oregon': ['Portland', 'Eugene', 'Salem', 'Bend'],
  'Pennsylvania': ['Philadelphia', 'Pittsburgh', 'Allentown', 'Lancaster'],
  'Rhode Island': ['Providence', 'Warwick', 'Cranston'],
  'South Carolina': ['Charleston', 'Greenville', 'Columbia', 'Spartanburg'],
  'South Dakota': ['Sioux Falls', 'Rapid City', 'Aberdeen'],
  'Tennessee': ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga'],
  'Texas': ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth'],
  'Utah': ['Salt Lake City', 'Provo', 'Ogden', 'St George'],
  'Vermont': ['Burlington', 'Montpelier', 'Rutland'],
  'Virginia': ['Richmond', 'Virginia Beach', 'Arlington', 'Roanoke'],
  'Washington': ['Seattle', 'Spokane', 'Tacoma', 'Bellevue'],
  'West Virginia': ['Charleston', 'Huntington', 'Morgantown'],
  'Wisconsin': ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha'],
  'Wyoming': ['Cheyenne', 'Casper', 'Laramie'],
};

/**
 * CHIROPRACTOR FINDER — Runs on demand or weekly
 * Searches Google Maps for chiropractors in the next unsearched state,
 * scrapes contact info, and adds to outreach database.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabase();

    // Find the next state to search — check which states already have prospects
    const { data: existingStates } = await supabase
      .from('outreach_prospects')
      .select('state');

    const searchedStates = new Set((existingStates || []).map((s: any) => s.state));
    const allStates = Object.keys(STATE_CITIES);
    const nextState = allStates.find(s => !searchedStates.has(s));

    if (!nextState) {
      return NextResponse.json({ success: true, message: 'All states have been searched', added: 0 });
    }

    const cities = STATE_CITIES[nextState];
    let added = 0;
    let skipped = 0;

    // Search each city in the state
    for (const city of cities) {
      try {
        const searchUrl = `https://serpapi.com/search.json?engine=google_maps&q=chiropractor+${encodeURIComponent(city)}+${encodeURIComponent(nextState)}&type=search&api_key=${SERPAPI_KEY}`;

        const res = await fetch(searchUrl, { signal: AbortSignal.timeout(15000) });
        if (!res.ok) continue;

        const data = await res.json();
        const results = data.local_results || [];

        for (const biz of results) {
          const name = biz.title || '';
          const address = biz.address || '';
          const phone = biz.phone || null;
          const website = biz.website || null;
          const rating = biz.rating || null;

          // Skip if no name or it's a chain (The Joint, etc)
          if (!name) continue;
          if (name.toLowerCase().includes('the joint')) continue;
          if (name.toLowerCase().includes('snap crack')) continue;

          // Check if already in database
          const { data: existing } = await supabase
            .from('outreach_prospects')
            .select('id')
            .ilike('name', `%${name.substring(0, 20)}%`)
            .eq('state', nextState)
            .limit(1);

          if (existing && existing.length > 0) {
            skipped++;
            continue;
          }

          // Find email from website
          let email: string | null = null;
          let instagram: string | null = null;
          if (website) {
            const contactInfo = await scrapeContactInfo(website);
            email = contactInfo.email;
            instagram = contactInfo.instagram;
          }

          // Add to outreach database
          await supabase.from('outreach_prospects').insert({
            name: name,
            clinic_name: name,
            city: city,
            state: nextState,
            phone: phone,
            website: website,
            email: email,
            instagram_handle: instagram,
            status: 'new',
            source: 'chiro_finder_agent',
            notes: rating ? `Google rating: ${rating}` : null,
          });

          added++;
        }
      } catch (err) {
        console.error(`[CHIRO FINDER] Error searching ${city}, ${nextState}:`, err);
      }
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      category: 'AUTOMATION',
      event: `Chiro Finder: Searched ${nextState} — ${added} added, ${skipped} duplicates skipped`,
      user_name: 'System',
      target: nextState,
      status: 'Success',
      severity: 'Medium',
      metadata: { state: nextState, added, skipped, cities: cities.length },
    });

    return NextResponse.json({
      success: true,
      message: `Searched ${nextState}: ${added} chiropractors added, ${skipped} skipped`,
      state: nextState,
      added,
      skipped,
    });
  } catch (err: any) {
    console.error('[CHIRO FINDER ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function scrapeContactInfo(websiteUrl: string): Promise<{ email: string | null; instagram: string | null }> {
  let url = websiteUrl.trim();
  if (!url.startsWith('http')) url = `https://${url}`;

  let email: string | null = null;
  let instagram: string | null = null;

  for (const page of [url, `${url}/contact`, `${url}/about`]) {
    try {
      const res = await fetch(page, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NeuroChiro/1.0)' },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) continue;
      const html = await res.text();

      // Find email
      if (!email) {
        const emails = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
        const junk = ['example.com', 'sentry.io', 'wix.com', 'squarespace.com', 'wordpress.com', 'google.com', 'facebook.com', 'cloudflare', '.png', '.jpg', '.svg', '.css', '.js'];
        const valid = emails.filter(e => !junk.some(j => e.toLowerCase().includes(j)));
        if (valid.length > 0) {
          email = valid.find(e => /^(info|contact|office|hello|admin|support|dr|doc)/i.test(e)) || valid[0];
        }
      }

      // Find Instagram
      if (!instagram) {
        const igMatch = html.match(/instagram\.com\/([a-zA-Z0-9_.]+)/);
        if (igMatch && igMatch[1] && !['p', 'explore', 'accounts', 'stories', 'reel'].includes(igMatch[1])) {
          instagram = igMatch[1];
        }
      }

      if (email && instagram) break;
    } catch { continue; }
  }

  return { email, instagram };
}
