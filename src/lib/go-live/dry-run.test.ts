import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { runGoLiveDryRun } from './dry-run.ts'
import { GO_LIVE_STEPS } from './steps.ts'

describe('doctor go-live dry run', () => {
  const report = runGoLiveDryRun()

  it('walks a test doctor through all 7 steps with sends stubbed', () => {
    assert.equal(report.doctor.is_test, true)
    assert.equal(report.sends, 'stubbed')
    assert.deepEqual(report.steps.map((step) => step.step), [...GO_LIVE_STEPS])
    assert.equal(report.steps.every((step) => step.status === 'ok'), true)
    assert.match(report.steps.map((step) => step.reason).join('\n'), /Nothing was sent|Nothing was posted|No account was created/)
  })

  it('publishes the website phone, the first visit, and clean FAQs', () => {
    assert.equal(report.profile.publishedPhone, '+18645550199')
    assert.notEqual(report.profile.publishedPhone, report.doctor.mobile)
    assert.match(report.profile.firstVisit, /60 minutes/)
    assert.equal(report.profile.faqs.some((question) => /menu|quick links/i.test(question)), false)
    assert.equal(report.profile.needsAiEnrich, true)
    assert.doesNotMatch(report.profile.firstVisit, /alignlife|patient/i)
  })

  it('welcomes with the onboarding link only', () => {
    assert.equal(report.welcome.hasOnboarding, true)
    assert.equal(report.welcome.hasLogin, true)
    assert.equal(report.welcome.hasSpotlight, false)
    assert.equal(report.welcome.hasIgLive, false)
    assert.match(report.sms, /neurochiro-onboarding-call/)
    assert.match(report.sms, /neurochiro\.co\/login/)
    assert.doesNotMatch(report.sms, /!|Spotlight|IG Live/)
  })

  it('does not repeat welcome, waitlist, or Instagram on a second run', () => {
    for (const step of ['welcome', 'waitlist', 'instagram'] as const) {
      assert.equal(report.retry.find((item) => item.step === step)?.status, 'skipped')
    }
  })

  it('alerts when the webhook is silent or the signature fails', () => {
    assert.match(report.webhookHealth.signature || '', /signature/i)
    assert.match(report.webhookHealth.stalePaid || '', /2 paid checkout/)
  })
})
