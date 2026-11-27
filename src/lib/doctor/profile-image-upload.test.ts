import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  friendlyUploadError,
  isProfileImageKind,
  pathBelongsTo,
  profileImageExt,
  profileImagePath,
  tooLargeMessage,
} from './profile-image-upload.ts'

describe('profile image uploads', () => {
  it('builds paths in the same folders as before', () => {
    assert.equal(profileImagePath({ userId: 'u1', kind: 'avatar', ext: 'jpg', now: 5, nonce: 'ab' }), 'u1/5-ab.jpg')
    assert.equal(profileImagePath({ userId: 'u1', kind: 'team', ext: 'png', now: 5, nonce: 'ab' }), 'u1/team/5-ab.png')
  })

  it('only lets a doctor finish uploads in their own folder', () => {
    assert.equal(pathBelongsTo('u1/5-ab.jpg', 'u1', 'avatar'), true)
    assert.equal(pathBelongsTo('u1/gallery/5-ab.jpg', 'u1', 'gallery'), true)
    assert.equal(pathBelongsTo('u2/gallery/5-ab.jpg', 'u1', 'gallery'), false)
    assert.equal(pathBelongsTo('u1/banner/5-ab.jpg', 'u1', 'gallery'), false)
    assert.equal(pathBelongsTo('u1/../u2/5.jpg', 'u1', 'avatar'), false)
    assert.equal(pathBelongsTo('u1/gallery/x/5.jpg', 'u1', 'gallery'), false)
    assert.equal(pathBelongsTo('', 'u1', 'avatar'), false)
  })

  it('accepts the usual phone and web image types only', () => {
    assert.equal(profileImageExt('a.JPG', ''), 'jpg')
    assert.equal(profileImageExt('a.heic', ''), 'heic')
    assert.equal(profileImageExt('a', 'image/webp'), 'webp')
    assert.equal(profileImageExt('a.gif', 'image/gif'), null)
    assert.equal(isProfileImageKind('team'), true)
    assert.equal(isProfileImageKind('other'), false)
  })

  it('explains a too-big request instead of failing silently', () => {
    assert.match(friendlyUploadError(new Error('Body exceeded 1 MB limit.'), 'x'), /too large/)
    assert.match(friendlyUploadError(new TypeError('Failed to fetch'), 'x'), /connection/)
    assert.equal(friendlyUploadError(new Error('other'), 'fallback'), 'fallback')
    assert.match(tooLargeMessage(12 * 1024 * 1024), /12 MB/)
  })
})
