import test from 'node:test';
import assert from 'node:assert/strict';
import { claimQuoteRequest } from '../lib/ai-quote-consent-claim.mjs';

const fixture = () => {
  const project={id:'p1',ownerId:'u1',category:'maling',publicDescription:'Mal stuen og loftet',address:'PRIVATE'};
  const contractor={id:'c1',sourceUrl:'https://example.dk/c1'};
  const consent={id:'s1',ownerId:'u1',projectId:'p1',contractorId:'c1',granted:true,expiresAt:2000};
  let consumed=false;
  const store={
    async getOwnedProject({ownerId,projectId}) { return ownerId==='u1' && projectId==='p1' ? project : null; },
    async getContractor({contractorId}) { return contractorId==='c1' ? contractor : null; },
    async getConsent({ownerId,consentId}) { return ownerId==='u1' && consentId==='s1' ? consent : null; },
    async consumeConsentOnce() { if(consumed) return false; consumed=true; return true; }
  };
  return {store};
};
const args = store => ({authenticatedUserId:'u1',projectId:'p1',contractorId:'c1',consentId:'s1',store,now:1000});

test('valid consent is claimed once without leaking private project fields', async () => {
  const {store}=fixture(); const result=await claimQuoteRequest(args(store));
  assert.equal(result.ok,true);
  assert.equal(JSON.stringify(result.payload).includes('PRIVATE'),false);
  assert.equal((await claimQuoteRequest(args(store))).reason,'consent_already_consumed_or_revoked');
});
test('concurrent requests cannot both claim the same consent', async () => {
  const {store}=fixture(); const results=await Promise.all([claimQuoteRequest(args(store)),claimQuoteRequest(args(store))]);
  assert.equal(results.filter(r=>r.ok).length,1);
});
test('cross-account access fails before consuming consent', async () => {
  const {store}=fixture(); const result=await claimQuoteRequest({...args(store),authenticatedUserId:'u2'});
  assert.equal(result.reason,'project_not_found_or_forbidden');
});
test('cross-contractor access fails', async () => {
  const {store}=fixture(); const result=await claimQuoteRequest({...args(store),contractorId:'c2'});
  assert.equal(result.ok,false);
});
test('missing transactional adapter fails closed', async () => {
  assert.equal((await claimQuoteRequest(args({}))).reason,'secure_store_required');
});
test('expired consent fails before claim', async () => {
  const {store}=fixture(); const result=await claimQuoteRequest({...args(store),now:2000});
  assert.equal(result.ok,false);
});
