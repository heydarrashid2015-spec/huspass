import test from 'node:test';
import assert from 'node:assert/strict';
import { selectVerifiedContractors } from '../lib/ai-verified-shortlist.mjs';
const candidate = {cvr:'10150817',categories:['maling'],postalCodes:['2100'],sourceUrl:'https://example.dk/company'};
const official = {cvr:'10150817',name:'Registry Name',active:true};
const opts = {category:'maling',postalCode:'2100'};
test('fails closed without independent registry data',()=> {
  assert.deepEqual(selectVerifiedContractors([{...candidate,verified:true,registryVerified:true}],[],opts),[]);
});
test('uses registry name and never invents quote prices',()=> {
  assert.deepEqual(selectVerifiedContractors([{...candidate,name:'Forged'}],[official],opts),[
    {cvr:'10150817',name:'Registry Name',sourceUrl:candidate.sourceUrl,registryVerified:true,quoteStatus:'not_requested',priceDkk:null}
  ]);
});
test('rejects inactive, wrong area, wrong category and missing provenance',()=> {
  assert.deepEqual(selectVerifiedContractors([candidate],[{...official,active:false}],opts),[]);
  assert.deepEqual(selectVerifiedContractors([candidate],[official],{...opts,postalCode:'8000'}),[]);
  assert.deepEqual(selectVerifiedContractors([candidate],[official],{...opts,category:'have'}),[]);
  assert.deepEqual(selectVerifiedContractors([{...candidate,sourceUrl:'http://example.dk'}],[official],opts),[]);
});
test('deduplicates CVR and never returns more than three',()=> {
  assert.equal(selectVerifiedContractors(Array(5).fill(candidate),[official],opts).length,1);
});
test('rejects malformed project context and untrusted registry metadata',()=> {
  assert.deepEqual(selectVerifiedContractors([candidate],[{...official,cvr:'10150818'}],opts),[]);
  assert.deepEqual(selectVerifiedContractors([candidate],[official],{category:'',postalCode:'2100'}),[]);
});
