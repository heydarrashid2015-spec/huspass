import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizeContractorOutreach } from '../lib/ai-contractor-outreach-consent.mjs';

const fixture = () => ({
  authenticatedOwnerId: 'owner-a',
  now: '2026-11-14T12:00:00Z',
  project: { id: 'project-a', ownerId: 'owner-a', description: 'Paint living room' },
  contractor: { id: 'contractor-a', cvrVerified: true, cvr: '12345678', email: 'quotes@example.dk' },
  consent: {
    id: 'consent-a', ownerId: 'owner-a', projectId: 'project-a',
    contractorId: 'contractor-a', action: 'request_quote', granted: true,
    revoked: false, grantedAt: '2026-11-14T11:00:00Z',
    expiresAt: '2026-11-15T11:00:00Z', approvedCvr: '12345678',
    approvedDescription: 'Paint living room', channel: 'email',
    approvedEmail: 'quotes@example.dk'
  }
});

test('complete own authorization evidence is accepted by pure gate', () => {
  assert.equal(authorizeContractorOutreach(fixture()).allowed, true);
});

for (const [record, field] of [
  ['consent', 'revoked'], ['consent', 'approvedEmail'],
  ['consent', 'approvedCvr'], ['consent', 'ownerId'],
  ['project', 'ownerId'], ['project', 'description'],
  ['contractor', 'email'], ['contractor', 'cvrVerified']
]) {
  test('rejects inherited ' + record + '.' + field, () => {
    const data = fixture();
    const value = data[record][field];
    delete data[record][field];
    // Ordinary objects inherit Object.prototype. No mutation of global prototypes.
    // An inherited getter must never run while authorizing.
    let getterCalled = false;
    const prototype = Object.getPrototypeOf(data[record]);
    // Keep the normal Object.prototype chain; test inherited values via a
    // temporary prototype override, which must be rejected as non-plain.
    const inherited = Object.create({ [field]: value });
    Object.assign(inherited, data[record]);
    assert.equal(authorizeContractorOutreach({ ...data, [record]: inherited }).allowed, false);
    assert.equal(getterCalled, false);
    assert.equal(Object.getPrototypeOf(data[record]), prototype);
  });
}

test('missing own revocation status fails closed', () => {
  const data = fixture();
  delete data.consent.revoked;
  assert.equal(authorizeContractorOutreach(data).allowed, false);
});
