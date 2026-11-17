import test from 'node:test';
import assert from 'node:assert/strict';
import { canContactContractor } from '../src/lib/contractorContactConsent.mjs';

const consent = { approved: true, customerId: 'owner', homeId: 'home', contractorCvr: '12345678', purpose: 'request_quote', approvedAt: '2026-11-17T07:00:00Z', expiresAt: '2026-11-18T07:00:00Z' };
const base = { consent, customerId: 'owner', homeId: 'home', contractorCvr: '12345678', now: Date.parse('2026-11-17T08:00:00Z') };

test('canonical owner and home identifiers authorize only matching consent', () => {
  assert.equal(canContactContractor(base), true);
  for (const id of [' owner', 'owner ', 'owner\\n', '\\towner', '']) {
    assert.equal(canContactContractor({ ...base, customerId: id, consent: { ...consent, customerId: id } }), false);
  }
  for (const id of [' home', 'home ', 'home\\r', '\\thome', '']) {
    assert.equal(canContactContractor({ ...base, homeId: id, consent: { ...consent, homeId: id } }), false);
  }
});
