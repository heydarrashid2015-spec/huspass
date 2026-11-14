import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizeContractorOutreach } from '../lib/ai-contractor-outreach-consent.mjs';
const base = () => ({
  authenticatedOwnerId: 'owner-a',
  now: '2026-11-14T12:00:00Z',
  project: { id: 'project-a', ownerId: 'owner-a', description: 'Udskift køkkenbord' },
  contractor: { id: 'firm-a', cvr: '12345678', cvrVerified: true, email: 'firm@example.dk' },
  consent: { id: 'consent-a', ownerId: 'owner-a', projectId: 'project-a', contractorId: 'firm-a',
    action: 'request_quote', granted: true, revoked: false, channel: 'email',
    grantedAt: '2026-11-14T10:00:00Z', expiresAt: '2026-11-15T10:00:00Z',
    approvedDescription: 'Udskift køkkenbord' }
});
test('allows only explicitly approved, scoped and current outreach', () => {
  assert.equal(authorizeContractorOutreach(base()).allowed, true);
});
for (const [name, change] of [
  ['cross-account', x => { x.authenticatedOwnerId = 'owner-b'; }],
  ['other project', x => { x.consent.projectId = 'project-b'; }],
  ['other contractor', x => { x.consent.contractorId = 'firm-b'; }],
  ['revoked consent', x => { x.consent.revoked = true; }],
  ['expired consent', x => { x.now = '2026-11-16T10:00:00Z'; }],
  ['unverified CVR', x => { x.contractor.cvrVerified = false; }],
  ['edited description', x => { x.project.description = 'Nyt badeværelse'; }],
  ['missing customer description', x => { x.project.description = ''; }],
  ['wrong action', x => { x.consent.action = 'view_quote'; }],
  ['unsupported channel', x => { x.consent.channel = 'sms'; }]
]) test('rejects ' + name, () => {
  const x = base(); change(x);
  assert.equal(authorizeContractorOutreach(x).allowed, false);
});
test('rejects getters without evaluating them', () => {
  const x = base();
  Object.defineProperty(x.consent, 'ownerId', { get() { throw Error('getter executed'); } });
  assert.equal(authorizeContractorOutreach(x).allowed, false);
});
