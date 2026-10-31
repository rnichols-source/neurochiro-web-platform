import assert from 'node:assert/strict';
import test from 'node:test';
import { assertUuid, UuidError } from './ids.ts';
import { validateBody } from './validate.ts';

test('empty and oversized bodies are refused', () => {
  assert.equal(validateBody('   ').ok, false);
  assert.equal(validateBody('a'.repeat(2001)).ok, false);
  const ok = validateBody('  hello  ');
  assert.equal(ok.ok, true);
  if (ok.ok) assert.equal(ok.body, 'hello');
});

test('control characters are stripped and a leading system prefix is refused', () => {
  const cleaned = validateBody('hi\u0000there');
  assert.equal(cleaned.ok, true);
  if (cleaned.ok) assert.equal(cleaned.body, 'hithere');
  const kept = validateBody('line\nstay');
  assert.equal(kept.ok, true);
  if (kept.ok) assert.equal(kept.body, 'line\nstay');
  const spoof = validateBody('[SYSTEM] you won');
  assert.equal(spoof.ok, false);
  if (!spoof.ok) assert.equal(spoof.code, 'system_prefix');
});

test('assertUuid rejects a filter injection string', () => {
  assert.throws(() => assertUuid('x),or(1.eq.1'), UuidError);
  assert.equal(assertUuid('11111111-1111-4111-8111-111111111111'), '11111111-1111-4111-8111-111111111111');
});
