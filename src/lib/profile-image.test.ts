import assert from 'node:assert/strict'
import test from 'node:test'
import {
  PROFILE_IMAGE_MAX_BYTES,
  PROFILE_IMAGE_MAX_EDGE,
  SERVER_ACTION_PASSTHROUGH_MAX_BYTES,
  canSkipReencode,
  encodingAttempts,
  fitLongEdge,
  isHeicFile,
  profileUploadErrorMessage,
} from './profile-image.ts'

test('long side scales to 1200px and the short side keeps its ratio', () => {
  assert.deepEqual(fitLongEdge(4000, 3000, PROFILE_IMAGE_MAX_EDGE), { width: 1200, height: 900 })
  assert.deepEqual(fitLongEdge(3000, 4000, PROFILE_IMAGE_MAX_EDGE), { width: 900, height: 1200 })
})

test('images already within the long-side limit are not enlarged', () => {
  assert.deepEqual(fitLongEdge(800, 600, PROFILE_IMAGE_MAX_EDGE), { width: 800, height: 600 })
})

test('encoding tries the long-side limit before smaller sizes', () => {
  const attempts = encodingAttempts(4032, 3024)
  assert.equal(attempts[0].width, 1200)
  assert.equal(attempts[0].height, 900)
  assert.ok(attempts[0].quality > attempts[1].quality)
  const sizes = new Set(attempts.map((attempt) => `${attempt.width}x${attempt.height}`))
  assert.ok(sizes.has('1200x900'))
  assert.ok(sizes.has('640x480'))
  assert.equal(attempts.filter((attempt) => attempt.width === 1200).length, 4)
})

test('a small jpeg that already fits is left as-is', () => {
  assert.equal(canSkipReencode({ type: 'image/jpeg', size: 180 * 1024 }, 900, 900), true)
  assert.equal(canSkipReencode({ type: 'image/png', size: 180 * 1024 }, 2400, 1800), false)
  assert.equal(canSkipReencode({ type: 'image/jpeg', size: PROFILE_IMAGE_MAX_BYTES + 1 }, 800, 800), false)
  assert.equal(canSkipReencode({ type: 'image/gif', size: 20 * 1024 }, 400, 400), false)
})

test('heic is recognized from the type or the file name', () => {
  assert.equal(isHeicFile({ type: 'image/heic', name: 'IMG_1' }), true)
  assert.equal(isHeicFile({ type: '', name: 'headshot.HEIC' }), true)
  assert.equal(isHeicFile({ type: 'image/jpeg', name: 'headshot.jpg' }), false)
})

test('a server-action body-limit failure becomes a visible message', () => {
  const message = profileUploadErrorMessage(new Error('Body exceeded 1 MB limit.\nTo configure the body size limit for Server Actions, see: https://nextjs.org/docs'))
  assert.match(message, /too large to upload/)
  assert.doesNotMatch(message, /nextjs\.org/)
  assert.ok(SERVER_ACTION_PASSTHROUGH_MAX_BYTES < 1024 * 1024)
})

test('a storage error from the action is shown, and an empty failure is not silent', () => {
  assert.equal(
    profileUploadErrorMessage('Upload failed: bucket not found'),
    'Upload failed: bucket not found',
  )
  assert.match(profileUploadErrorMessage(''), /was not saved/)
  assert.match(profileUploadErrorMessage(new Error('An unexpected response was received from the server.')), /was not saved/)
})
