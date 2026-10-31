import test from 'node:test';
import assert from 'node:assert/strict';
import { isUntouchedCarePlanDefault, matchesPlExample } from './tool-examples.ts';

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
  }), false);
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
});
