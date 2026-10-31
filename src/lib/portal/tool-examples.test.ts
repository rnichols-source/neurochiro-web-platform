import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanPracticeField, isUntouchedCarePlanDefault, matchesPlExample, plInitialView } from './tool-examples.ts';

test('isUntouchedCarePlanDefault recognizes the old $65 template', () => {
  assert.equal(isUntouchedCarePlanDefault({
    perVisitFee: 65,
    patientName: '',
    phases: [
      { name: 'Intensive', visitsPerWeek: 3, weeks: 4 },
      { name: 'Corrective', visitsPerWeek: 2, weeks: 8 },
      { name: 'Stabilization', visitsPerWeek: 1, weeks: 12 },
    ],
  }), true);
  assert.equal(isUntouchedCarePlanDefault({
    perVisitFee: 65,
    patientName: 'Ada',
    phases: [
      { name: 'Intensive', visitsPerWeek: 3, weeks: 4 },
      { name: 'Corrective', visitsPerWeek: 2, weeks: 8 },
      { name: 'Stabilization', visitsPerWeek: 1, weeks: 12 },
    ],
  }), true);
  assert.equal(isUntouchedCarePlanDefault({ perVisitFee: 65, __confirmed: true, phases: [] }), false);
  assert.equal(isUntouchedCarePlanDefault({ perVisitFee: 80, __example: true, phases: [] }), true);
  assert.equal(cleanPracticeField('[DOCTOR NAME]', 'Dr. Raymond Nichols'), 'Dr. Raymond Nichols');
  assert.equal(cleanPracticeField('Dr. Raymond Nichols', ''), 'Dr. Raymond Nichols');
  assert.equal(isUntouchedCarePlanDefault({ perVisitFee: null, patientName: '', phases: [] }), false);
});

test('matchesPlExample catches a saved marker and an exact example', () => {
  const examples: { id: string; lineItems: Record<string, number> }[] = [
    { id: 'established-practice', lineItems: { '4020': 80000, '4035': 0 } },
    { id: 'other', lineItems: { '4020': 1000 } },
  ];
  assert.equal(matchesPlExample({ '4020': 80000, __example: 'established-practice' }, examples), 'established-practice');
  assert.equal(matchesPlExample({ '4020': 80000, '4035': 0 }, examples), 'established-practice');
  assert.equal(matchesPlExample({ '4020': 10 }, examples), null);
  assert.deepEqual(plInitialView({ '4020': 80000, '4035': 0 }, examples), { mode: 'blank', exampleId: 'established-practice', cleared: true });
  assert.deepEqual(plInitialView({ '4020': 80000, '4035': 0, __confirmed: true }, examples), { mode: 'saved', exampleId: null, cleared: false });
  assert.deepEqual(plInitialView(null, examples), { mode: 'blank', exampleId: null, cleared: false });
});
