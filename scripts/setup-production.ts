/**
 * NeuroChiro Production Setup Verification
 * Run with: npx ts-node scripts/setup-production.ts
 *
 * Checks all required environment variables and tells you what's missing.
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

interface EnvCheck {
  name: string;
  required: boolean;
  description: string;
  whereToGet: string;
  isSet: boolean;
}

const checks: Omit<EnvCheck, 'isSet'>[] = [
  // === REQUIRED ===
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    description: 'Supabase project URL',
    whereToGet: 'Supabase Dashboard > Project Settings > API > Project URL',
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    description: 'Supabase anonymous/public API key',
    whereToGet: 'Supabase Dashboard > Project Settings > API > anon/public key',
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    description: 'Supabase service role key (keeps data secure on the server)',
    whereToGet: 'Supabase Dashboard > Project Settings > API > service_role key (keep secret!)',
  },
  {
    name: 'STRIPE_SECRET_KEY',
    required: true,
    description: 'Stripe secret API key for processing payments',
    whereToGet: 'Stripe Dashboard > Developers > API keys > Secret key',
  },
  {
    name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    required: true,
    description: 'Stripe public key for the checkout form',
    whereToGet: 'Stripe Dashboard > Developers > API keys > Publishable key',
  },
  {
    name: 'STRIPE_WEBHOOK_SECRET',
    required: true,
    description: 'Stripe webhook signing secret (verifies payment events are real)',
    whereToGet: 'Stripe Dashboard > Developers > Webhooks > Your endpoint > Signing secret',
  },
  {
    name: 'STRIPE_STARTER_MONTHLY_PRICE_ID',
    required: true,
    description: 'Stripe Price ID for Starter monthly ($49/mo)',
    whereToGet: 'Stripe Dashboard > Product catalog > NeuroChiro Starter > Monthly price ID',
  },
  {
    name: 'STRIPE_STARTER_ANNUAL_PRICE_ID',
    required: true,
    description: 'Stripe Price ID for Starter annual ($490/yr)',
    whereToGet: 'Stripe Dashboard > Product catalog > NeuroChiro Starter > Annual price ID',
  },
  {
    name: 'STRIPE_GROWTH_MONTHLY_PRICE_ID',
    required: true,
    description: 'Stripe Price ID for Growth monthly ($99/mo)',
    whereToGet: 'Stripe Dashboard > Product catalog > NeuroChiro Growth > Monthly price ID',
  },
  {
    name: 'STRIPE_GROWTH_ANNUAL_PRICE_ID',
    required: true,
    description: 'Stripe Price ID for Growth annual ($990/yr)',
    whereToGet: 'Stripe Dashboard > Product catalog > NeuroChiro Growth > Annual price ID',
  },
  {
    name: 'STRIPE_PRO_MONTHLY_PRICE_ID',
    required: true,
    description: 'Stripe Price ID for Pro monthly ($199/mo)',
    whereToGet: 'Stripe Dashboard > Product catalog > NeuroChiro Pro > Monthly price ID',
  },
  {
    name: 'STRIPE_PRO_ANNUAL_PRICE_ID',
    required: true,
    description: 'Stripe Price ID for Pro annual ($1,990/yr)',
    whereToGet: 'Stripe Dashboard > Product catalog > NeuroChiro Pro > Annual price ID',
  },
  {
    name: 'ANTHROPIC_API_KEY',
    required: true,
    description: 'Anthropic API key for AI Bio Generator and Contract Lab',
    whereToGet: 'console.anthropic.com > API Keys > Create Key',
  },
  {
    name: 'RESEND_API_KEY',
    required: true,
    description: 'Resend API key for sending emails',
    whereToGet: 'resend.com > Dashboard > API Keys',
  },
  {
    name: 'NEXT_PUBLIC_SITE_URL',
    required: true,
    description: 'Your live site URL (used for links, redirects, and badge embeds)',
    whereToGet: 'Set to https://neurochiro.co (or your custom domain)',
  },
  {
    name: 'NEXT_PUBLIC_FOUNDER_EMAILS',
    required: true,
    description: 'Comma-separated founder email addresses for admin bootstrap',
    whereToGet: 'Set to your email address(es), e.g. drray@neurochirodirectory.com',
  },
  {
    name: 'CRON_SECRET',
    required: true,
    description: 'Secret token to protect cron job endpoints from unauthorized access',
    whereToGet: 'Generate one by running: openssl rand -hex 32',
  },

  // === IMPORTANT BUT NOT BLOCKING ===
  {
    name: 'NEXT_PUBLIC_MAPBOX_TOKEN',
    required: false,
    description: 'Mapbox token for the directory map with doctor pins',
    whereToGet: 'mapbox.com > Account > Default public token',
  },
  {
    name: 'DISCORD_WEBHOOK_URL',
    required: false,
    description: 'Discord webhook for admin alerts (new signups, events)',
    whereToGet: 'Discord > Your server > Channel settings > Integrations > Webhooks > Copy URL',
  },

  // === OPTIONAL ===
  {
    name: 'TWILIO_ACCOUNT_SID',
    required: false,
    description: 'Twilio account SID for SMS notifications (optional)',
    whereToGet: 'twilio.com > Console > Account SID',
  },
  {
    name: 'GOOGLE_PLACES_API_KEY',
    required: false,
    description: 'Google Places API key for doctor review display (optional)',
    whereToGet: 'Google Cloud Console > APIs > Places API > Credentials',
  },
];

// Run checks
console.log('\n========================================');
console.log('  NEUROCHIRO PRODUCTION SETUP CHECK');
console.log('========================================\n');

const results: EnvCheck[] = checks.map(c => ({
  ...c,
  isSet: !!process.env[c.name] && process.env[c.name] !== '' && !process.env[c.name]!.startsWith('your-'),
}));

const missing = results.filter(r => r.required && !r.isSet);
const optionalMissing = results.filter(r => !r.required && !r.isSet);
const allSet = results.filter(r => r.isSet);

// Show what's set
console.log(`SET (${allSet.length}/${results.length}):`);
allSet.forEach(r => {
  const value = process.env[r.name] || '';
  const preview = value.length > 20 ? value.slice(0, 8) + '...' + value.slice(-4) : value;
  console.log(`  [OK] ${r.name} = ${preview}`);
});

if (missing.length > 0) {
  console.log(`\nMISSING - REQUIRED (${missing.length}):`);
  missing.forEach(r => {
    console.log(`\n  [!!] ${r.name}`);
    console.log(`       What: ${r.description}`);
    console.log(`       Get it: ${r.whereToGet}`);
  });
}

if (optionalMissing.length > 0) {
  console.log(`\nMISSING - OPTIONAL (${optionalMissing.length}):`);
  optionalMissing.forEach(r => {
    console.log(`  [--] ${r.name} — ${r.description}`);
  });
}

console.log('\n========================================');
if (missing.length === 0) {
  console.log('  ALL REQUIRED VARIABLES ARE SET');
  console.log('  You are ready to deploy!');
} else {
  console.log(`  ${missing.length} REQUIRED VARIABLE(S) MISSING`);
  console.log('  Fix these before deploying.');
}
console.log('========================================\n');

process.exit(missing.length > 0 ? 1 : 0);
