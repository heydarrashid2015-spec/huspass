import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectContractorEvidence, shortlistWithEvidence } from '../lib/ai-contractor-evidence.mjs';
const candidate = {name:'Firma A', cvr:'12345678', services:['maling'], servicePostcodes:['2100'], sourceUrl:'https://firma.example/om-os', registryUrl:'https://datacvr.virk.dk/?cvr=12345678'};
test('registry URL alone never asserts official verification', () => {
  const result = inspectContractorEvidence(candidate);
  assert.equal(result.registryMatchesCvr, true);
  assert.equal(result.officialVerification, false);
});
test('reject spoofed registry hosts and mismatched CVR', () => {
  assert.equal(inspectContractorEvidence({...candidate, registryUrl:'https://datacvr.virk.dk.evil.example/?cvr=12345678'}).registryPointer,false);
  assert.equal(inspectContractorEvidence({...candidate, registryUrl:'https://datacvr.virk.dk/?cvr=87654321'}).registryMatchesCvr,false);
});
test('reject source URLs with embedded credentials', () => {
  assert.equal(inspectContractorEvidence({...candidate,sourceUrl:'https://user:password@firma.example/'}).attributableSource,false);
});
test('shortlist requires category and declared service area, no fabricated quotes', () => {
  const list=shortlistWithEvidence([candidate,{...candidate,name:'duplicate'}, {...candidate,name:'Other',cvr:'87654321',services:['have']}],{category:'maling',postcode:'2100'});
  assert.equal(list.length,1);
  assert.equal(list[0].quotedPrice,null);
  assert.equal(list[0].quoteStatus,'not_requested');
});
test('unverified company gets no registry boost', () => {
  const list=shortlistWithEvidence([candidate],{category:'maling',postcode:'2100'});
  assert.equal(list[0].score,50);
  assert.equal(list[0].verificationStatus,'unverified');
});
test('incomplete project location produces no recommendations', () => {
  assert.deepEqual(shortlistWithEvidence([candidate],{category:'maling'}),[]);
});
