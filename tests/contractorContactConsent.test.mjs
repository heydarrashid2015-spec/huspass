import test from 'node:test';
import assert from 'node:assert/strict';
import { canContactContractor } from '../src/lib/contractorContactConsent.mjs';

const now = Date.parse('2026-11-17T08:00:00Z');
const valid = {
  approved: true, customerId: 'customer-a', homeId: 'home-a',
  contractorCvr: '12345678', purpose: 'request_quote',
  approvedAt: '2026-11-17T07:00:00Z', expiresAt: '2026-11-18T07:00:00Z'
};
const check = (consent, overrides = {}) => canContactContractor({
  consent, customerId: 'customer-a', homeId: 'home-a',
  contractorCvr: '12345678', now, ...overrides
});

test('permits only matching, current, explicit quote consent', () => {
  assert.equal(check(valid), true);
  assert.equal(check(null), false);
  assert.equal(check({...valid, approved: false}), false);
  assert.equal(check({...valid, revoked: true}), false);
  assert.equal(check({...valid, purpose: 'marketing'}), false);
});
test('prevents cross-account, cross-home and cross-contractor reuse', () => {
  for (const field of ['customerId','homeId','contractorCvr']) {
    assert.equal(check({...valid, [field]: 'other'}), false, field);
  }
  assert.equal(check(valid, {customerId: 'customer-b'}), false);
  assert.equal(check(valid, {contractorCvr: '87654321'}), false);
});
test('rejects expired, future, malformed and unbounded consent', () => {
  assert.equal(check({...valid, expiresAt: '2026-11-17T08:00:00Z'}), false);
  assert.equal(check({...valid, approvedAt: '2026-11-17T09:00:00Z'}), false);
  assert.equal(check({...valid, expiresAt: undefined}), false);
  assert.equal(check({...valid, approvedAt: 'invalid'}), false);
});

test('rejects consent whose expiry precedes or equals its approval', () => {
  assert.equal(check({...valid, approvedAt: '2026-11-17T07:00:00Z', expiresAt: '2026-11-17T06:00:00Z'}, {now: Date.parse('2026-11-17T05:00:00Z')}), false);
  assert.equal(check({...valid, expiresAt: valid.approvedAt}, {now: Date.parse('2026-11-17T06:00:00Z')}), false);
});
test('accepts only plain consent records, not arrays or class instances', () => {
  assert.equal(check([valid]), false);
  assert.equal(check(Object.assign(new (class Consent {})(), valid)), false);
  assert.equal(check(Object.assign(Object.create(null), valid)), true);
});

test('rejects ambiguous timestamps and normalized invalid calendar dates', () => {
  for (const approvedAt of ['2026-11-17', '2026-11-17T07:00:00', '2026-02-30T07:00:00Z', '2026-11-17T25:00:00Z', '2026-11-17T07:00:00+24:00']) {
    assert.equal(check({...valid, approvedAt}), false, approvedAt);
  }
  assert.equal(check({...valid, expiresAt: '2026-11-18T07:00:00'}), false);
});

test('accepts valid offset timestamps without changing their instant', () => {
  assert.equal(check({...valid, approvedAt: '2026-11-17T08:00:00+01:00', expiresAt: '2026-11-18T08:00:00+01:00'}), true);
});

test('accepts an exact RFC3339 UTC timestamp and rejects escaped digit literals', () => {
  assert.equal(check({...valid, approvedAt: '2026-11-17T07:00:00Z'}), true);
  assert.equal(check({...valid, approvedAt: 'dddd-11-17T07:00:00Z'}), false);
  assert.equal(check({...valid, approvedAt: '2026-11-17T07:00:00.123Z'}), true);
});


test('rejects malformed revocation flags instead of treating them as consent', () => {
  for (const revoked of ['true', 'false', 1, 0, null, {}, []]) {
    assert.equal(check({...valid, revoked}), false, String(revoked));
  }
  assert.equal(check({...valid, revoked: false}), true);
  assert.equal(check(valid), true); // Legacy records without a revocation flag remain supported.
});
