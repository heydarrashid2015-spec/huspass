import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizeContractorOutreach } from '../lib/ai/contractor-outreach-consent.mjs';

const actorId = 'owner-1';
const project = { id: 'home-1', ownerId: actorId };
const contractor = { id: 'company-1', cvr: '01234567' };
const consent = { ownerId: actorId, projectId: project.id, contractorId: contractor.id, action: 'request_quote', granted: true, grantedAt: new Date().toISOString(), revoked: false };

test('rejects array consent records even when all expected fields are attached', () => {
  const arrayConsent = [];
  Object.assign(arrayConsent, consent);
  assert.deepEqual(authorizeContractorOutreach({ actorId, project, contractor, consent: arrayConsent }), { allowed: false, reason: 'explicit_consent_required' });
});

test('accepts the same explicitly authorized plain record', () => {
  assert.deepEqual(authorizeContractorOutreach({ actorId, project, contractor, consent }), { allowed: true, reason: 'consent_verified' });
});
