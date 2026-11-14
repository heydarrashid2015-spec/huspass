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

test('accepts a syntactically valid eight-digit CVR and contractor email', () => {
  const x = base();
  assert.equal(authorizeContractorOutreach(x).allowed, true);
});
for (const [label, cvr] of [['letters', 'abcdefgh'], ['too short', '1234567'], ['too long', '123456789'], ['embedded spaces', '1234 678']]) {
  test('rejects CVR with ' + label, () => {
    const x = base(); x.contractor.cvr = cvr;
    assert.equal(authorizeContractorOutreach(x).allowed, false);
  });
}
for (const [label, email] of [['missing dot', 'firm@exampledk'], ['whitespace', 'firm name@example.dk'], ['missing at sign', 'firm.example.dk']]) {
  test('rejects contractor email with ' + label, () => {
    const x = base(); x.contractor.email = email;
    assert.equal(authorizeContractorOutreach(x).allowed, false);
  });
}

test('rejects coercible CVR without invoking user-defined conversion', () => {
  const x = base();
  let called = false;
  x.contractor.cvr = { toString() { called = true; throw Error('unsafe conversion'); } };
  assert.equal(authorizeContractorOutreach(x).allowed, false);
  assert.equal(called, false);
});
test('rejects numeric CVR instead of silently converting it', () => {
  const x = base(); x.contractor.cvr = 12345678;
  assert.equal(authorizeContractorOutreach(x).allowed, false);
});
test('rejects coercible clock without invoking user-defined conversion', () => {
  const x = base();
  let called = false;
  x.now = { toString() { called = true; throw Error('unsafe clock'); } };
  assert.equal(authorizeContractorOutreach(x).allowed, false);
  assert.equal(called, false);
});

for (const [label, revocation] of [
  ['missing revocation state', undefined],
  ['null revocation state', null],
  ['string false revocation state', 'false'],
  ['numeric revocation state', 0]
]) {
  test('rejects ' + label, () => {
    const x = base();
    if (revocation === undefined) delete x.consent.revoked;
    else x.consent.revoked = revocation;
    assert.equal(authorizeContractorOutreach(x).allowed, false);
  });
}

for (const [label, mutate] of [
  ['timezone-free timestamp', x => { x.now = '2026-11-14T12:00:00'; }],
  ['offset timestamp', x => { x.consent.grantedAt = '2026-11-14T11:00:00+01:00'; }],
  ['invalid calendar date', x => { x.consent.expiresAt = '2026-11-31T10:00:00Z'; }],
  ['date-only timestamp', x => { x.now = '2026-11-14'; }],
  ['invalid hour rollover', x => { x.consent.grantedAt = '2026-11-14T25:00:00Z'; }]
]) test('rejects ' + label + ' in consent timestamps', () => {
  const x = base(); mutate(x);
  assert.equal(authorizeContractorOutreach(x).allowed, false);
});
