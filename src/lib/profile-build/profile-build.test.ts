import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { extractProfile } from './extract.ts'
import { applyResearch, decideListingPhone, draftFromExtraction, fillOnlyBlank, researchColumns } from './fill.ts'
import type { PageDocument } from './types.ts'
import { discoverTargets, isPublicHttpUrl } from './urls.ts'
import { buildVoicePrompt, emptyVoice, sanitizeVoice, VOICE_INSTRUCTIONS } from './voice.ts'

const dir = dirname(fileURLToPath(import.meta.url))
const read = (name: string) => readFileSync(join(dir, 'fixtures', name), 'utf8')
const NOW = '2026-11-14T18:00:00.000Z'
const HOME = 'https://harbor.example/'

function pages(): PageDocument[] {
  return [
    { url: HOME, html: read('home.html'), kind: 'home' },
    { url: 'https://harbor.example/about', html: read('about.html'), kind: 'about' },
    { url: 'https://harbor.example/services', html: read('services.html'), kind: 'services' },
    { url: 'https://harbor.example/faq', html: read('faq.html'), kind: 'faq' },
    { url: 'https://harbor.example/contact', html: read('contact.html'), kind: 'contact' },
    { url: 'https://harbor.janeapp.com/#/book', html: read('booking.html'), kind: 'booking' },
  ]
}

describe('profile extraction', () => {
  it('finds the public pages and booking link from the home page', () => {
    const targets = discoverTargets(HOME, read('home.html'))
    assert.equal(targets.about, 'https://harbor.example/about')
    assert.equal(targets.faq, 'https://harbor.example/faq')
    assert.equal(targets.services, 'https://harbor.example/services')
    assert.equal(targets.contact, 'https://harbor.example/contact')
    assert.equal(targets.booking, 'https://harbor.janeapp.com/')
  })

  it('reads clinic facts from fixture HTML and ignores the listed phone', () => {
    const extracted = extractProfile(pages())
    assert.equal(extracted.clinicName, 'Harbor Nervous System')
    assert.equal(extracted.headshotUrl, 'https://harbor.example/images/dr-ada-og.jpg')
    assert.match(extracted.hours, /Monday–Thursday 8:00 AM–5:00 PM/)
    assert.match(extracted.hours, /Friday 8:00 AM–12:00 PM/)
    assert.equal(extracted.bookingUrl, 'https://harbor.janeapp.com/#/book')
    assert.equal(extracted.instagramUrl, 'https://www.instagram.com/harborneuro/')
    assert.equal(extracted.facebookUrl, 'https://www.facebook.com/harborneuro')
    assert.equal(extracted.tiktokUrl, 'https://www.tiktok.com/@harborneuro')
    assert.ok(extracted.certifications.includes('Webster'))
    assert.ok(extracted.certifications.includes('DACNB'))
    assert.deepEqual(extracted.techniques, ['NUCCA', 'TOR', 'Webster'])
    assert.match(extracted.firstVisitInfo, /60 minutes/)
    assert.equal(extracted.firstVisitPrice, '$150')
    assert.deepEqual(extracted.acceptedPayment, ['Cash', 'Card', 'HSA'])
    assert.equal(extracted.paymentModel, 'cash')
    assert.equal(extracted.filesInsurance, false)
    assert.equal(extracted.address, '123 Main Street')
    assert.equal(extracted.city, 'Greenville')
    assert.equal(extracted.state, 'SC')
    assert.equal(extracted.zipCode, '29601')
    assert.equal(extracted.country, 'US')
    assert.equal(extracted.faqs.length, 3)
    assert.equal(extracted.faqs[0].question, 'What happens at the first visit?')
    assert.equal(extracted.practicePhone, '+18645550199')
    assert.equal(Object.hasOwn(extracted, 'phone'), false)
    assert.ok(extracted.galleryUrls.some((url) => url.includes('ada-portrait')))
    assert.doesNotMatch(extracted.clinicName, /alignlife/i)
    assert.doesNotMatch(extracted.hours, /perfect storm/i)
  })

  it('drops navigation and footer questions and keeps the first-visit section', () => {
    const extracted = extractProfile([
      ...pages(),
      {
        url: 'https://harbor.example/menu',
        kind: 'home',
        html: `
          <nav><h2>Menu</h2><p>Home About Services Contact Book</p></nav>
          <footer><h3>Quick links</h3><p>Privacy policy and terms live here.</p></footer>
          <h2>Your first visit</h2>
          <p>Plan on 60 minutes for the first visit. The visit fee is $175 and includes the scan.</p>
        `,
      },
    ])
    const questions = extracted.faqs.map((item) => item.question.toLowerCase())
    assert.equal(questions.includes('menu'), false)
    assert.equal(questions.includes('quick links'), false)
    assert.match(extracted.firstVisitInfo, /60 minutes/)
    assert.doesNotMatch(extracted.firstVisitInfo, /\bmenu\b/i)
    assert.equal(new Set(questions).size, questions.length)
  })

  it('uses the about-page portrait when the social image is a logo', () => {
    const extracted = extractProfile([
      {
        url: 'https://harbor.example/about',
        kind: 'about',
        html: '<html><head><meta property="og:image" content="https://harbor.example/logo.png" /></head><body><img class="portrait" src="/images/ada-portrait.jpg" alt="Dr. Ada Lovelace portrait" /></body></html>',
      },
    ])
    assert.equal(extracted.headshotUrl, 'https://harbor.example/images/ada-portrait.jpg')
  })

  it('refuses local and link-local addresses', () => {
    assert.equal(isPublicHttpUrl('https://harbor.example/about'), true)
    assert.equal(isPublicHttpUrl('http://127.0.0.1/secret'), false)
    assert.equal(isPublicHttpUrl('http://169.254.169.254/latest'), false)
    assert.equal(isPublicHttpUrl('http://10.1.1.1/admin'), false)
    assert.equal(isPublicHttpUrl('https://user:pass@harbor.example/'), false)
    assert.equal(isPublicHttpUrl('http://[::1]/'), false)
  })
})

describe('fill only blank fields', () => {
  const extracted = extractProfile(pages())
  const draft = draftFromExtraction(extracted, {
    bio: 'Dr. Ada Lovelace helps community members understand how the nervous system adapts.',
    shortIntro: 'Nervous system focused care in Greenville.',
    philosophy: 'The visit starts with what the nervous system is already doing.',
    faqs: [],
  }, 'https://cdn.example/headshot.jpg', 'https://harbor.example/')

  it('fills empty profile fields and leaves saved ones alone', () => {
    const patch = applyResearch({
      phone: '(864) 555-0100',
      bio: '',
      hours: null,
      clinic_name: '',
      photo_url: '',
      specialties: [],
      timezone: '',
      profile_built_at: null,
      city: '',
      state: '',
      country: '',
      files_insurance: null,
    }, draft, NOW)
    assert.equal(patch.clinic_name, 'Harbor Nervous System')
    assert.equal(patch.photo_url, 'https://cdn.example/headshot.jpg')
    assert.match(String(patch.hours), /Monday/)
    assert.match(String(patch.bio), /community members/)
    assert.equal(patch.timezone, 'America/New_York')
    assert.equal(patch.profile_built_at, NOW)
    assert.equal(patch.state, 'SC')
    assert.equal(patch.city, 'Greenville')
    assert.equal(patch.payment_model, 'cash')
    assert.equal(patch.files_insurance, false)
    assert.equal(Object.hasOwn(patch, 'phone'), false)
  })

  it('never overwrites phone or anything already set', () => {
    const current = {
      phone: '(864) 555-0100',
      lead_alert_phones: ['+18645550199'],
      email: 'ada@example.com',
      bio: 'The doctor already wrote this bio for the directory and it is long enough.',
      hours: 'Tue 9-5',
      clinic_name: 'Kept Name',
      photo_url: 'https://cdn.example/existing.jpg',
      specialties: ['Toggle'],
      timezone: 'America/Chicago',
      profile_built_at: '2026-01-01T00:00:00.000Z',
      city: 'Chicago',
      state: 'IL',
      country: 'US',
      short_intro: 'Already written.',
      philosophy: 'Already written.',
      faq: [{ question: 'Existing?', answer: 'Yes, and it stays.' }],
      booking_url: 'https://kept.example/book',
      files_insurance: false,
    }
    const patch = applyResearch(current, draft, NOW)
    assert.equal(Object.hasOwn(patch, 'phone'), false)
    assert.equal(Object.hasOwn(patch, 'lead_alert_phones'), false)
    assert.equal(Object.hasOwn(patch, 'email'), false)
    assert.equal(Object.hasOwn(patch, 'bio'), false)
    assert.equal(Object.hasOwn(patch, 'hours'), false)
    assert.equal(Object.hasOwn(patch, 'clinic_name'), false)
    assert.equal(Object.hasOwn(patch, 'photo_url'), false)
    assert.equal(Object.hasOwn(patch, 'specialties'), false)
    assert.equal(Object.hasOwn(patch, 'timezone'), false)
    assert.equal(Object.hasOwn(patch, 'profile_built_at'), false)
    assert.equal(Object.hasOwn(patch, 'city'), false)
    assert.equal(Object.hasOwn(patch, 'state'), false)
    assert.equal(Object.hasOwn(patch, 'faq'), false)
    assert.equal(Object.hasOwn(patch, 'booking_url'), false)
    assert.equal(Object.hasOwn(patch, 'files_insurance'), false)
    const blankPhone = applyResearch({ phone: '', lead_alert_phones: ['+18645550100'], profile_built_at: NOW }, draft, NOW)
    assert.equal(blankPhone.phone, '+18645550199')
    const replacedMobile = applyResearch({ phone: '+18645550100', lead_alert_phones: ['+18645550100'], profile_built_at: NOW }, draft, NOW)
    assert.equal(replacedMobile.phone, '+18645550199')
    assert.equal(decideListingPhone({
      currentPhone: '(864) 555-0100',
      practicePhone: '+18645550199',
      alertPhones: ['+18645550188'],
    }), null)
    const columns = researchColumns(draft)
    assert.equal(Object.hasOwn(columns, 'phone'), false)
    const forced = fillOnlyBlank(current, { ...columns, phone: '+18645550199', email: 'new@example.com' })
    assert.equal(Object.hasOwn(forced, 'phone'), false)
    assert.equal(Object.hasOwn(forced, 'email'), false)
  })

  it('sets a west-coast timezone when the stored value is only the New York default', () => {
    const patch = applyResearch({
      phone: '(415) 555-0100',
      timezone: 'America/New_York',
      profile_built_at: null,
      state: 'CA',
      country: 'US',
    }, draftFromExtraction({
      ...extracted,
      state: 'CA',
      city: 'San Francisco',
      address: '1 Market Street',
      zipCode: '94105',
    }, emptyVoice(), '', ''), NOW)
    assert.equal(patch.timezone, 'America/Los_Angeles')
    assert.equal(Object.hasOwn(patch, 'phone'), false)
  })

  it('does not mark the profile built when research is still incomplete', () => {
    const patch = applyResearch({ profile_built_at: null, hours: '' }, draft, NOW, { complete: false })
    assert.equal(Object.hasOwn(patch, 'profile_built_at'), false)
    assert.match(String(patch.hours), /Monday/)
  })
})

describe('NeuroChiro voice', () => {
  it('says community members and drops AlignLife and Perfect Storm', () => {
    const clean = sanitizeVoice('Patients love this. AlignLife trained the doctor. The Perfect Storm explains the pain. Community members are welcome.')
    assert.equal(/patient/i.test(clean), false)
    assert.equal(/alignlife/i.test(clean), false)
    assert.equal(/perfect storm/i.test(clean), false)
    assert.match(clean, /Community members are welcome/)
    assert.equal(sanitizeVoice('The Perfect Storm.'), '')
  })

  it('puts the voice rules in the writing instructions', () => {
    const prompt = `${VOICE_INSTRUCTIONS}\n${buildVoicePrompt('PAGE home https://harbor.example')}`
    assert.match(prompt, /community members/)
    assert.match(prompt, /AlignLife/)
    assert.match(prompt, /Perfect Storm/)
    assert.match(prompt, /Only use facts/)
  })
})
