import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizeContractorOutreach } from '../lib/ai/contractor-outreach-consent.mjs';

function input() {
  return {
    actorId: 'owner-a',
    project: { id: 'project-a', ownerId: 'owner-a' },
    contractor: { id: 'firm-a', cvr: '12345678' },
    consent: { ownerId: 'owner-a', projectId: 'project-a', contractorId: 'firm-a', action: 'request_quote', granted: true, grantedAt: new Date().toISOString() }
  };
}

test('inherited revocation signals cannot be ignored', () => {
  for (const [field, value] of [['revoked', true], ['revoked', 'true'], ['revokedAt', '2026-11-01T00:00:00.000Z']]) {
    const args = input();
    Object.setPrototypeOf(args.consent, { [field]: value });
    assert.deepEqual(authorizeContractorOutreach(args), { allowed: false, reason: 'consent_revoked' }, field);
  }
});

test('legacy consent without revocation fields remains valid', () => {
  assert.deepEqual(authorizeContractorOutreach(input()), { allowed: true, reason: 'consent_verified' });
});
