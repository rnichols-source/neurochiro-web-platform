import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { TECHNIQUES } from '../../app/(student)/student/techniques/technique-data.ts';
import { TECHNIQUE_OPTIONS, cleanAnswers, labelFor } from '../../config/match-questions.ts';
import { canDoctorMatch, canStudentMatch, publicStudentName } from './eligibility.ts';
import { allowDecision, insertMatchOnce, interestsFor, mutualReady } from './decide.ts';
import { WEIGHTS_V1, reasonSentence, scoreMatch, type ScoreSide } from './score.ts';
import { consumeOutcomeToken, signOutcomeToken } from './token.ts';

function side(overrides: Partial<ScoreSide> = {}): ScoreSide {
  return {
    technique: ['diversified'],
    patientFocus: ['pediatrics'],
    practiceModel: 'cash',
    practiceSize: 'solo',
    states: ['GA'],
    relocateAnywhere: false,
    maxDistanceMiles: null,
    homeLat: null,
    homeLng: null,
    clinicState: 'GA',
    clinicLat: null,
    clinicLng: null,
    startWindow: 'now',
    compModel: 'salary',
    careExplain: 'nervous-system',
    carePace: 'moderate',
    offers: ['associateship'],
    lookingFor: ['associateship'],
    ...overrides,
  };
}

describe('score', () => {
  it('weights sum to 100', () => {
    const sum = Object.values(WEIGHTS_V1).reduce((total, value) => total + value, 0);
    assert.equal(sum, 100);
  });

  it('scores identical profiles at 100', () => {
    const result = scoreMatch(side(), side());
    assert.equal(result.pct, 100);
    assert.equal(result.excluded, undefined);
    assert.equal(result.factors.technique, 1);
  });

  it('scores a disjoint pair low', () => {
    const result = scoreMatch(side({
      technique: ['diversified'],
      patientFocus: ['pediatrics'],
      practiceModel: 'cash',
      practiceSize: 'solo',
      states: ['TX'],
      relocateAnywhere: true,
      clinicState: 'TX',
      startWindow: 'now',
      compModel: 'salary',
      careExplain: 'nervous-system',
      carePace: 'moderate',
    }), side({
      technique: ['activator-methods'],
      patientFocus: ['athletes'],
      practiceModel: 'mostly-insurance',
      practiceSize: 'four-plus',
      states: [],
      clinicState: 'GA',
      startWindow: '12-plus-months',
      compModel: 'production',
      careExplain: 'symptom',
      carePace: 'high-volume',
    }));
    assert.equal(result.excluded, undefined);
    assert.ok(result.pct < 25);
  });

  it('excludes a student who will not relocate', () => {
    const result = scoreMatch(side({ states: ['TX'], relocateAnywhere: false, clinicState: 'TX' }), side({ clinicState: 'GA' }));
    assert.equal(result.excluded, 'location');
    assert.equal(result.pct, 0);
    assert.deepEqual(result.reasons, []);
  });

  it('counts a related technique family at 0.5', () => {
    const result = scoreMatch(
      side({ technique: ['network-spinal'] }),
      side({ technique: ['torque-release-technique'] }),
    );
    assert.equal(result.factors.technique, 0.5);
  });

  it('writes a plain reason and skips low factors', () => {
    const student = side({
      technique: ['diversified'],
      patientFocus: ['pediatrics'],
      practiceModel: 'cash',
      carePace: 'long-visits',
    });
    const doctor = side({
      technique: ['activator-methods'],
      patientFocus: ['pediatrics'],
      practiceModel: 'cash',
      carePace: 'high-volume',
    });
    const result = scoreMatch(student, doctor);
    assert.equal(result.reasons[0], 'Both focus on pediatrics and a cash practice.');
    assert.equal(result.reasons[0]?.includes('volume'), false);
    assert.equal(result.reasons[0]?.includes('Activator'), false);
  });

  it('mentions Georgia when location is one of the top factors', () => {
    const line = reasonSentence(['patient_focus', 'location'], side(), side({ clinicState: 'GA' }));
    assert.equal(line, 'Both focus on pediatrics in Georgia.');
    assert.equal(labelFor('state', 'GA'), 'Georgia');
  });

  it('keeps technique names aligned with the quiz list', () => {
    const labels = new Set(TECHNIQUE_OPTIONS.map((item) => item.label));
    for (const technique of TECHNIQUES) assert.equal(labels.has(technique.name), true);
    assert.equal(labels.has('Tonal / NeuroChiro-style'), true);
    assert.equal(labels.has('Other'), true);
  });

  it('rejects unknown answer keys', () => {
    const bad = cleanAnswers({ practice_model: 'cash', nickname: 'nope' });
    assert.equal(bad.ok, false);
  });
});

describe('eligibility', () => {
  it('excludes a non-member, an unverified school, and a doctor who is not open', () => {
    assert.equal(canStudentMatch({ memberAccess: false, schoolVerified: true, requireSchoolVerification: true, completed: true, visible: true }), false);
    assert.equal(canStudentMatch({ memberAccess: true, schoolVerified: false, requireSchoolVerification: true, completed: true, visible: true }), false);
    assert.equal(canStudentMatch({ memberAccess: true, schoolVerified: true, requireSchoolVerification: true, completed: true, visible: true }), true);
    assert.equal(canDoctorMatch({ member: true, openToStudents: false, completed: true, visible: true }), false);
    assert.equal(canDoctorMatch({ member: true, openToStudents: true, completed: true, visible: true }), true);
  });

  it('shows a student as a first name and last initial', () => {
    assert.equal(publicStudentName('Ada Lovelace'), 'Ada L.');
  });
});

describe('decide', () => {
  it('creates one match when two workers race', () => {
    const pair = { studentUserId: 'student', doctorUserId: 'doctor' };
    const snapshot: typeof pair[] = [];
    const left = insertMatchOnce(snapshot, pair);
    const right = insertMatchOnce(snapshot, pair);
    const merged = insertMatchOnce(left.rows, right.rows[0]);
    assert.equal(left.created, true);
    assert.equal(right.created, true);
    assert.equal(merged.created, false);
    assert.equal(merged.rows.length, 1);
  });

  it('never reveals a not_now to the other person', () => {
    const rows = [
      { from: 'student', to: 'doctor', decision: 'not_now' as const },
      { from: 'doctor', to: 'student', decision: 'interested' as const },
    ];
    const seen = interestsFor('doctor', rows);
    assert.equal(seen.some((row) => row.decision === 'not_now'), false);
    assert.equal(mutualReady(rows, 'student', 'doctor'), false);
  });

  it('stops at 50 new decisions in a day', () => {
    assert.equal(allowDecision(50, false), false);
    assert.equal(allowDecision(50, true), true);
  });
});

describe('outcome token', () => {
  it('is single-use', () => {
    const secret = 'test-secret';
    const token = signOutcomeToken({ matchId: 'm1', userId: 'u1', outcome: 'talked', exp: 2_000_000_000 }, secret);
    const used = new Set<string>();
    const first = consumeOutcomeToken(used, token, secret, 1_700_000_000);
    const second = consumeOutcomeToken(used, token, secret, 1_700_000_000);
    assert.equal(first.ok, true);
    assert.equal(second.ok, false);
    if (!second.ok) assert.equal(second.reason, 'used');
  });
});
