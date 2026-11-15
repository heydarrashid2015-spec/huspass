import test from 'node:test';
import assert from 'node:assert/strict';
import { assessContractorContact } from './quote-contact-consent.mjs';
const now = 1800000000000;
const base = () => ({ actorId:'owner_1', ownerId:'owner_1', projectId:'project_1',
  contractorIds:['cvr_1'], now,
  consent:{ actorId:'owner_1', projectId:'project_1', purpose:'contractor_quote_request',
    granted:true, grantedAt:now-1000, expiresAt:now+1000, contractorIds:['cvr_1'] } });
test('permits exact owner, purpose, recipient and live consent only', () => {
  assert.equal(assessContractorContact(base()).allowed, true);
});
test('rejects a different authenticated owner', () => {
  assert.equal(assessContractorContact({...base(),actorId:'other'}).allowed,false);
});
test('rejects consent for a different project or purpose', () => {
  const a=base();a.consent.projectId='other';assert.equal(assessContractorContact(a).allowed,false);
  const b=base();b.consent.purpose='marketing';assert.equal(assessContractorContact(b).allowed,false);
});
test('rejects expired or future consent and untrusted clock', () => {
  const a=base();a.consent.expiresAt=now;assert.equal(assessContractorContact(a).allowed,false);
  const b=base();b.consent.grantedAt=now+1;assert.equal(assessContractorContact(b).allowed,false);
  assert.equal(assessContractorContact({...base(),now:NaN}).allowed,false);
});
test('rejects unapproved, duplicate and excessive recipients', () => {
  assert.equal(assessContractorContact({...base(),contractorIds:['cvr_2']}).allowed,false);
  assert.equal(assessContractorContact({...base(),contractorIds:['cvr_1','cvr_1']}).allowed,false);
  assert.equal(assessContractorContact({...base(),contractorIds:['a','b','c','d']}).allowed,false);
});
test('fails closed on missing consent', () => {
  assert.equal(assessContractorContact({...base(),consent:null}).allowed,false);
});
