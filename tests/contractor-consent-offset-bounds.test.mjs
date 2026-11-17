import test from 'node:test';
import assert from 'node:assert/strict';
import { canContactContractor } from '../src/lib/contractorContactConsent.mjs';

const base = { approved: true, customerId: 'customer', homeId: 'home', contractorCvr: '12345678', purpose: 'request_quote', approvedAt: '2026-11-17T07:00:00Z', expiresAt: '2026-11-18T07:00:00Z' };
const args = { customerId: 'customer', homeId: 'home', contractorCvr: '12345678', now: Date.parse('2026-11-17T08:00:00Z') };

test('rejects out-of-range consent timezone offsets', () => {
  for (const offset of ['+14:01', '-14:30', '+15:00', '-23:59']) {
    assert.equal(canContactContractor({ ...args, consent: { ...base, approvedAt: '2026-11-17T07:00:00' + offset } }), false, offset);
  }
});

test('allows legitimate explicit offset without weakening consent checks', () => {
  assert.equal(canContactContractor({ ...args, consent: { ...base, approvedAt: '2026-11-17T07:00:00+00:00', expiresAt: '2026-11-18T21:00:00+14:00' } }), true);
});
