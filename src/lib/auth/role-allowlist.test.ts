import assert from 'node:assert/strict';
import test from 'node:test';
import { assertSelfServeRole } from './roles.ts';

for (const role of ['admin', 'founder', 'super_admin', 'Student ', undefined]) {
  test(`rejects ${String(role)}`, () => {
    assert.throws(() => assertSelfServeRole(role), /Invalid role/);
  });
}

test('accepts doctor, student, and patient', () => {
  assert.doesNotThrow(() => assertSelfServeRole('doctor'));
  assert.doesNotThrow(() => assertSelfServeRole('student'));
  assert.doesNotThrow(() => assertSelfServeRole('patient'));
});
