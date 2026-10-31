import assert from 'node:assert/strict';
import test from 'node:test';
import { publicDoctorName } from './greeting.ts';

test('publicDoctorName uses the doctor row, not the login name', () => {
  assert.equal(
    publicDoctorName({ first_name: 'Raymond', last_name: 'Nichols' }, 'Mariya Shaeffer'),
    'Dr. Raymond Nichols',
  );
  assert.equal(publicDoctorName({ first_name: 'Dr. Ray', last_name: '' }, null), 'Dr. Ray');
  assert.equal(publicDoctorName(null, 'Mariya Shaeffer'), 'Dr. Mariya Shaeffer');
  assert.equal(publicDoctorName(null, null), '');
});
