require('dotenv').config({ path: '../.env.local' });
const Stripe = require('stripe');
const fs = require('fs');
const csv = require('csv-parser'); // Run `npm install csv-parser` before running

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_...');
const CSV_FILE_PATH = process.argv[2] || './contacts.csv';

async function generateSegments() {
  console.log('🔄 Fetching active Stripe subscriptions...');
  const activeMembers = new Map();
  let hasMore = true;
  let startingAfter = undefined;

  // STEP 1: Fetch Stripe Source of Truth
  while (hasMore) {
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
      starting_after: startingAfter,
      expand: ['data.customer', 'data.plan.product'],
    });

    for (const sub of subscriptions.data) {
      const customer = sub.customer;
      const email = customer.email?.toLowerCase();
      if (!email) continue;

      activeMembers.set(email, {
        firstName: customer.name ? customer.name.split(' ')[0] : '',
        lastName: customer.name ? customer.name.split(' ').slice(1).join(' ') : '',
        email: email,
        stripeCustomerId: customer.id,
        plan: sub.plan?.product?.name || 'Unknown Plan',
        status: sub.status,
      });
    }

    if (subscriptions.has_more) {
      startingAfter = subscriptions.data[subscriptions.data.length - 1].id;
    } else {
      hasMore = false;
    }
  }

  console.log(`✅ Found ${activeMembers.size} active paying members in Stripe.`);

  // STEP 2: Compare with CSV
  console.log(`\n🔄 Processing CSV: ${CSV_FILE_PATH}`);
  const csvContacts = new Map();

  fs.createReadStream(CSV_FILE_PATH)
    .pipe(csv())
    .on('data', (row) => {
      // Assuming CSV has an 'Email' column. Adjust key if necessary (e.g. 'email address')
      const emailKey = Object.keys(row).find(k => k.toLowerCase().includes('email'));
      if (emailKey && row[emailKey]) {
        csvContacts.set(row[emailKey].toLowerCase().trim(), row);
      }
    })
    .on('end', () => {
      const segmentA = []; // Active Members (In Stripe)
      const segmentB = []; // Interested (In CSV, NOT in Stripe)
      const segmentC = []; // Unknown (In Stripe, NOT in CSV)

      // Evaluate Stripe members
      for (const [email, stripeData] of activeMembers.entries()) {
        segmentA.push(stripeData);
        if (!csvContacts.has(email)) {
          segmentC.push(stripeData);
        }
      }

      // Evaluate CSV contacts
      for (const [email, csvData] of csvContacts.entries()) {
        if (!activeMembers.has(email)) {
          segmentB.push(csvData);
        }
      }

      // Output Reports
      fs.writeFileSync('./segment_a_active_members.json', JSON.stringify(segmentA, null, 2));
      fs.writeFileSync('./segment_b_interested_not_paying.json', JSON.stringify(segmentB, null, 2));
      fs.writeFileSync('./segment_c_unknown_active.json', JSON.stringify(segmentC, null, 2));

      console.log('\n📊 SEGMENTATION REPORT 📊');
      console.log('-------------------------');
      console.log(`Segment A (Active Paying Members): ${segmentA.length}`);
      console.log(`Segment B (CSV Contacts Not Paying): ${segmentB.length}`);
      console.log(`Segment C (Active but Missing from CSV): ${segmentC.length}`);
      console.log('-------------------------');
      console.log('✅ Exports generated: segment_a_*.json, segment_b_*.json, segment_c_*.json');
    });
}

generateSegments().catch(console.error);
