import test from 'node:test';
import assert from 'node:assert/strict';
import { canContactContractor } from '../src/lib/contractorContactConsent.mjs';

const record = { approved: true, customerId: 'a', homeId: 'h', contractorCvr: '12345678', purpose: 'request_quote', approvedAt: '2026-11-17T07:00:00Z', expiresAt: '2026-11-18T07:00:00Z' };
const args = { customerId: 'a', homeId: 'h', contractorCvr: '12345678', now: Date.parse('2026-11-17T08:00:00Z') };

test('consent authorization fields must be own properties', () => {
  assert.equal(canContactContractor({ ...args, consent: record }), true);
  for (const key of Object.keys(record)) {
    const inherited = Object.create({ [key]: record[key] });
    Object.assign(inherited, record);
    delete inherited[key];
    assert.equal(canContactContractor({ ...args, consent: inherited }), false, key);
  }
});

test('inherited revoked flag cannot authorize contact', () => {
  const consent = Object.assign(Object.create({ revoked: true }), record);
  assert.equal(canContactContractor({ ...args, consent }), false);
});
