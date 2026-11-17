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
