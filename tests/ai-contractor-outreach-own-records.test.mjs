import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizeContractorOutreach } from '../lib/ai/contractor-outreach-consent.mjs';

function args() {
  return {
    actorId: 'owner-a',
    project: { id: 'home-a', ownerId: 'owner-a' },
    contractor: { id: 'firm-a', cvr: '12345678' },
    consent: {
      ownerId: 'owner-a', projectId: 'home-a', contractorId: 'firm-a',
      action: 'request_quote', granted: true, grantedAt: new Date().toISOString()
    }
  };
}

test('rejects inherited owner and project identifiers even with otherwise valid consent', () => {
  for (const key of ['ownerId', 'id']) {
    const input = args();
    const value = input.project[key];
    delete input.project[key];
    Object.setPrototypeOf(input.project, { [key]: value });
    assert.deepEqual(authorizeContractorOutreach(input), { allowed: false, reason: 'project_access_denied' }, key);
  }
});

test('rejects inherited contractor identifiers or CVR even with valid consent', () => {
  for (const key of ['id', 'cvr']) {
    const input = args();
    const value = input.contractor[key];
    delete input.contractor[key];
    Object.setPrototypeOf(input.contractor, { [key]: value });
    assert.deepEqual(authorizeContractorOutreach(input), { allowed: false, reason: 'contractor_unverified' }, key);
  }
});

test('rejects array records and permits explicit own-field records', () => {
  const valid = args();
  assert.deepEqual(authorizeContractorOutreach(valid), { allowed: true, reason: 'consent_verified' });
  for (const key of ['project', 'contractor']) {
    const input = args();
    input[key] = Object.assign([], input[key]);
    assert.equal(authorizeContractorOutreach(input).allowed, false, key);
  }
});
