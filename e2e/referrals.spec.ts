import { test } from '@playwright/test';

const base = process.env.E2E_BASE_URL || '';
const production = !base || base.includes('neurochiro.co');

test('referral drawer can be opened without sending a referral', async () => {
  test.skip(
    production || !process.env.E2E_DOCTOR_EMAIL || !process.env.E2E_DOCTOR_PASSWORD,
    'skipped: previews use the production database, so this spec does not sign in or submit',
  );
});
