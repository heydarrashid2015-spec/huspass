import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizeContractorOutreach } from '../lib/ai/contractor-outreach-consent.mjs';

const valid = () => ({
  actorId: 'owner-a',
  project: { id: 'project-a', ownerId: 'owner-a' },
  contractor: { id: 'firm-a', cvr: '12345678' },
  consent: { ownerId: 'owner-a', projectId: 'project-a', contractorId: 'firm-a', action: 'request_quote', granted: true, grantedAt: new Date().toISOString() }
});

test('inherited consent fields cannot authorize contractor contact', () => {
  for (const key of ['ownerId', 'projectId', 'contractorId', 'action', 'granted', 'grantedAt']) {
    const input = valid();
    const inherited = { [key]: input.consent[key] };
    delete input.consent[key];
    Object.setPrototypeOf(input.consent, inherited);
    assert.deepEqual(authorizeContractorOutreach(input), { allowed: false, reason: 'explicit_consent_required' }, key);
  }
});

test('explicit own consent fields remain valid', () => {
  assert.deepEqual(authorizeContractorOutreach(valid()), { allowed: true, reason: 'consent_verified' });
});
