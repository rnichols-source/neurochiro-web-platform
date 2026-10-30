import { test, expect } from '@playwright/test'

/**
 * Hits a Preview deployment only. It stays skipped in normal runs so it cannot
 * create a lead on neurochiro.co. Set LEADS_E2E=1, LEADS_E2E_BASE_URL, and
 * LEADS_E2E_DOCTOR_ID to a verified is_test doctor.
 */
test('profile appointment and instagram contact form accept a lead', async ({ request }) => {
  test.skip(process.env.LEADS_E2E !== '1', 'Set LEADS_E2E=1 to run this against Preview')
  const base = process.env.LEADS_E2E_BASE_URL
  const doctorId = process.env.LEADS_E2E_DOCTOR_ID
  const slug = process.env.LEADS_E2E_DOCTOR_SLUG
  test.skip(!base || !doctorId || !slug, 'LEADS_E2E_BASE_URL, LEADS_E2E_DOCTOR_ID, and LEADS_E2E_DOCTOR_SLUG are required')

  const appointment = await request.post(`${base}/api/appointment`, {
    data: {
      patientName: 'Preview Lead Phone',
      patientPhone: '864-555-0199',
      preferredDate: 'Tomorrow morning',
      message: 'Please call after lunch',
      doctorId,
    },
  })
  expect(appointment.ok()).toBeTruthy()
  expect(await appointment.json()).toMatchObject({ success: true })

  const emailOnly = await request.post(`${base}/api/appointment`, {
    data: {
      patientName: 'Preview Lead Email',
      patientEmail: 'preview-lead@example.com',
      message: 'Email only',
      doctorId,
    },
  })
  expect(emailOnly.ok()).toBeTruthy()

  const instagram = await request.post(`${base}/api/contact-request`, {
    data: {
      doctorId,
      name: 'Preview Instagram Lead',
      phone: '864-555-0144 x12',
      email: 'preview-ig@example.com',
      note: 'looking for treatment for my son',
      consent: true,
      consentText: 'I am asking the office to contact me.',
      source: 'dm_outreach',
    },
  })
  expect(instagram.ok()).toBeTruthy()
  const body = await instagram.json()
  expect(body.ok).toBe(true)
  expect(body.withdrawUrl).toContain('/api/contact-request/withdraw?token=')

  const pageRes = await request.get(`${base}/contact-request?doctor=${slug}&source=dm_outreach`)
  expect(pageRes.ok()).toBeTruthy()
})
