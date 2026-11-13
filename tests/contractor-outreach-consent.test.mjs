import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizeContractorOutreach } from '../lib/ai/contractor-outreach-consent.mjs';

const now = () => new Date().toISOString();
const valid = () => ({
 actorId: 'owner-a',
 project: { id: 'home-project-1', ownerId: 'owner-a' },
 contractor: { id: 'contractor-1', cvr: '12345678' },
 consent: { ownerId: 'owner-a', projectId: 'home-project-1', contractorId: 'contractor-1', action: 'request_quote', granted: true, grantedAt: now() }
});
test('explicit scoped consent permits preparing an outreach request', () => assert.equal(authorizeContractorOutreach(valid()).allowed, true));
for (const [name, change] of [
 ['missing consent', x => delete x.consent],
 ['other tenant', x => x.actorId = 'owner-b'],
 ['other project', x => x.consent.projectId = 'other'],
 ['other contractor', x => x.consent.contractorId = 'other'],
 ['non-explicit approval', x => x.consent.granted = 'true'],
 ['wrong action', x => x.consent.action = 'view_quote'],
 ['revoked consent', x => x.consent.revoked = true],
 ['old consent', x => x.consent.grantedAt = '2020-01-01T00:00:00.000Z'],
 ['future consent', x => x.consent.grantedAt = new Date(Date.now()+86400000).toISOString()],
 ['invalid timestamp', x => x.consent.grantedAt = 'not-a-date'],
 ['invalid CVR', x => x.contractor.cvr = '1234'],
 ['missing actor', x => x.actorId = '']
]) test('deny '+name, () => { const x=valid();change(x);assert.equal(authorizeContractorOutreach(x).allowed,false); });

test('CVR is exactly eight ASCII digits, not a literal backslash-d sequence', () => {
  for (const cvr of ['12345678', '00000000']) {
    const input = valid();
    input.contractor.cvr = cvr;
    assert.equal(authorizeContractorOutreach(input).allowed, true, cvr);
  }
  for (const cvr of ['1234567', '123456789', '1234 5678', 'abcdefgh', '１２３４５６７８', String.raw`\\d{8}`]) {
    const input = valid();
    input.contractor.cvr = cvr;
    assert.equal(authorizeContractorOutreach(input).allowed, false, cvr);
  }
});

test('fail closed for ambiguous revocation flags', () => {
  for (const revoked of ['true', 'false', 1, 0, null, {}, []]) {
    const input = valid();
    input.consent.revoked = revoked;
    assert.equal(authorizeContractorOutreach(input).allowed, false, String(revoked));
  }
  for (const revoked of [false]) {
    const input = valid();
    input.consent.revoked = revoked;
    assert.equal(authorizeContractorOutreach(input).allowed, true);
  }
});

test('CVR must be a string and cannot be coerced from untrusted values', () => {
  for (const cvr of [12345678, 0, null, undefined, true, ['12345678'], { toString: () => '12345678' }]) {
    const input = valid();
    input.contractor.cvr = cvr;
    assert.equal(authorizeContractorOutreach(input).allowed, false, String(cvr));
  }
  const input = valid();
  input.contractor.cvr = '01234567';
  assert.equal(authorizeContractorOutreach(input).allowed, true, 'leading zero must be preserved');
});

// Reject non-string and blank identifiers before any server-side outreach preparation.
test('project and contractor identifiers must be nonblank strings', () => {
  for (const id of [0, 123, null, undefined, true, [], {}, '', '   ']) {
    const projectInput = valid();
    projectInput.project.id = id;
    assert.equal(authorizeContractorOutreach(projectInput).allowed, false, 'project id');
    const contractorInput = valid();
    contractorInput.contractor.id = id;
    assert.equal(authorizeContractorOutreach(contractorInput).allowed, false, 'contractor id');
  }
});
