import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  APPLY_URL,
  applicationReminderSmsEnabled,
  deliverReminders,
  dueEmailReminder,
  reminderMail,
  reminderSmsTo,
  reminderText,
  type ReminderCandidate,
} from './reminder-plan.ts'

const NOW = new Date('2026-11-05T15:00:00.000Z')

function row(overrides: Partial<ReminderCandidate> = {}): ReminderCandidate {
  return {
    id: 'app-1',
    email: 'ada@example.com',
    firstName: 'Ada',
    status: 'draft',
    cardOnFile: false,
    createdAt: new Date(NOW.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    reminder1hSentAt: null,
    reminder24hSentAt: null,
    smsConsent: true,
    mobile: '+18645550100',
    ...overrides,
  }
}

describe('application reminder timing', () => {
  it('sends the 1-hour note once, and the 24-hour note once the day has passed', () => {
    const fresh = row({ createdAt: new Date(NOW.getTime() - 30 * 60 * 1000).toISOString() })
    assert.equal(dueEmailReminder({ ...fresh, now: NOW }), null)
    assert.equal(dueEmailReminder({ ...row(), now: NOW }), '1h')
    assert.equal(dueEmailReminder({ ...row(), reminder1hSentAt: NOW.toISOString(), now: NOW }), null)
    const day = row({ createdAt: new Date(NOW.getTime() - 25 * 60 * 60 * 1000).toISOString() })
    assert.equal(dueEmailReminder({ ...day, now: NOW }), '24h')
    assert.equal(dueEmailReminder({ ...day, reminder24hSentAt: NOW.toISOString(), now: NOW }), null)
  })

  it('stops when they submit or save a card', () => {
    assert.equal(dueEmailReminder({ ...row(), status: 'under_review', now: NOW }), null)
    assert.equal(dueEmailReminder({ ...row(), status: 'approved', now: NOW }), null)
    assert.equal(dueEmailReminder({ ...row(), cardOnFile: true, now: NOW }), null)
  })

  it('texts only a consented US or Canadian number, and only when the flag is on', () => {
    assert.equal(applicationReminderSmsEnabled({ APPLICATION_REMINDER_SMS_ENABLED: 'false' } as unknown as NodeJS.ProcessEnv), false)
    assert.equal(applicationReminderSmsEnabled({} as unknown as NodeJS.ProcessEnv), false)
    assert.equal(applicationReminderSmsEnabled({ APPLICATION_REMINDER_SMS_ENABLED: 'true' } as unknown as NodeJS.ProcessEnv), true)
    assert.equal(reminderSmsTo({ enabled: false, consent: true, phone: '8645550100' }), null)
    assert.equal(reminderSmsTo({ enabled: true, consent: false, phone: '8645550100' }), null)
    assert.equal(reminderSmsTo({ enabled: true, consent: true, phone: '+447911123456' }), null)
    assert.equal(reminderSmsTo({ enabled: true, consent: true, phone: '(864) 555-0100' }), '+18645550100')
  })

  it('writes a warm note from Dr. Ray with the application link', () => {
    for (const kind of ['1h', '24h'] as const) {
      const mail = reminderMail(kind, 'Ada <script>')
      const text = reminderText(kind, 'Ada')
      assert.match(mail.html, /about 5 minutes/)
      assert.match(mail.html, /isn't charged unless you're approved/)
      assert.match(mail.html, /Dr\. Ray, NeuroChiro/)
      assert.match(mail.html, new RegExp(APPLY_URL.replace(/[.]/g, '\\.')))
      assert.equal(mail.html.includes('neurochirodirectory.com'), false)
      assert.equal(mail.html.includes('<script>'), false)
      assert.match(text, /about 5 minutes/)
      assert.match(text, /isn't charged unless you're approved/)
      assert.match(text, /Reply STOP to opt out/)
      assert.match(text, new RegExp(APPLY_URL.replace(/[.]/g, '\\.')))
    }
  })

  it('claims each reminder once and does not text when the flag is off', async () => {
    const claimed: string[] = []
    const released: string[] = []
    const emails: string[] = []
    const texts: string[] = []
    const result = await deliverReminders({
      now: NOW,
      smsEnabled: false,
      rows: [row(), row({ id: 'app-2', email: 'nope' }), row({ id: 'app-3', status: 'under_review' })],
      claim: async (id, kind) => {
        const key = `${id}:${kind}`
        if (claimed.includes(key)) return 'taken'
        claimed.push(key)
        return 'claimed'
      },
      release: async (id, kind) => { released.push(`${id}:${kind}`) },
      sendEmail: async (mail) => {
        emails.push(mail.to)
        return mail.to !== 'bounce@example.com'
      },
      sendSms: async (message) => {
        texts.push(message.to)
        return true
      },
    })
    assert.deepEqual(emails, ['ada@example.com'])
    assert.deepEqual(texts, [])
    assert.equal(result.emailed, 1)
    assert.equal(result.texted, 0)
    assert.deepEqual(released, [])
  })

  it('releases the claim when the email does not send, and texts when allowed', async () => {
    const released: string[] = []
    const texts: string[] = []
    const result = await deliverReminders({
      now: NOW,
      smsEnabled: true,
      rows: [row({ email: 'bounce@example.com' }), row({ id: 'app-2' })],
      claim: async () => 'claimed',
      release: async (id) => { released.push(id) },
      sendEmail: async (mail) => mail.to !== 'bounce@example.com',
      sendSms: async (message) => {
        texts.push(message.to)
        return true
      },
    })
    assert.deepEqual(released, ['app-1'])
    assert.deepEqual(texts, ['+18645550100'])
    assert.equal(result.emailed, 1)
    assert.equal(result.texted, 1)
  })

  it('stops the batch when the reminder columns are not there yet', async () => {
    let sends = 0
    const result = await deliverReminders({
      now: NOW,
      smsEnabled: false,
      rows: [row(), row({ id: 'app-2' })],
      claim: async () => 'unavailable',
      release: async () => {},
      sendEmail: async () => {
        sends += 1
        return true
      },
      sendSms: async () => true,
    })
    assert.equal(sends, 0)
    assert.equal(result.unavailable, true)
    assert.equal(result.emailed, 0)
  })
})
