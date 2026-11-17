import test from 'node:test';
import assert from 'node:assert/strict';
import { canContactContractor } from '../src/lib/contractorContactConsent.mjs';

const consent = { approved: true, customerId: 'owner', homeId: 'home', contractorCvr: '12345678', purpose: 'request_quote', approvedAt: '2026-11-17T07:00:00Z', expiresAt: '2026-11-18T07:00:00Z' };
const base = { consent, customerId: 'owner', homeId: 'home', contractorCvr: '12345678', now: Date.parse('2026-11-17T08:00:00Z') };

test('contractor CVR requires canonical string rather than coercible object', () => {
  assert.equal(canContactContractor(base), true);
  for (const cvr of [12345678, new String('12345678'), { toString: () => '12345678' }, ['12345678'], ' 12345678', '12345678 ']) {
    assert.equal(canContactContractor({ ...base, contractorCvr: cvr }), false);
  }
});
