import { test } from '@playwright/test';

const base = process.env.E2E_BASE_URL || '';
const enabled = process.env.E2E_ALLOW_WRITES === '1'
  && Boolean(base)
  && !base.includes('neurochiro.co')
  && Boolean(process.env.E2E_STUDENT_EMAIL)
  && Boolean(process.env.E2E_DOCTOR_A_EMAIL);

test('student and doctor both say interested', async () => {
  test.skip(!enabled, 'Set E2E_ALLOW_WRITES, a non-production E2E_BASE_URL, E2E_STUDENT_EMAIL, and E2E_DOCTOR_A_EMAIL.');
});
