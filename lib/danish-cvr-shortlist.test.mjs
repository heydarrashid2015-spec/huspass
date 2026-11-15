import test from 'node:test';
import assert from 'node:assert/strict';
import {isValidDanishCvr,isSafeEvidenceUrl,shortlistVerifiedContractors} from './danish-cvr-shortlist.mjs';
const cvr='10150817';
const base=(overrides={})=>({cvr,name:'Testfirma',registryVerified:true,registryStatus:'active',
 registryEvidenceUrl:'https://datacvr.virk.dk/',categories:['maling'],municipalities:['Aarhus'],
 verifiedRelevantJobs:3,...overrides});
const shortlist=(items)=>shortlistVerifiedContractors(items,{category:'maling',municipality:'Aarhus'});
test('CVR mod-11 checksum rejects invalid and malformed values',()=>{
 assert.equal(isValidDanishCvr(cvr),true);
 assert.equal(isValidDanishCvr('10150818'),false);
 assert.equal(isValidDanishCvr('DK10150817'),false);
 assert.equal(isValidDanishCvr(10150817),false);
});
test('shortlist requires matching area, trade, registry proof and active status',()=>{
 assert.equal(shortlist([base()]).length,1);
 for(const change of [{registryVerified:false},{registryStatus:'inactive'},
  {registryEvidenceUrl:'http://example.org'},{municipalities:['Odense']},
  {categories:['have']},{verifiedRelevantJobs:undefined},{name:''}]) {
  assert.equal(shortlist([base(change)]).length,0);
 }
});
test('duplicate CVR with conflicting evidence is excluded, not arbitrarily preferred',()=>{
 assert.equal(shortlist([base(),base({name:'Other name'})]).length,0);
 assert.equal(shortlist([base(),base({verifiedRelevantJobs:999})]).length,0);
 assert.equal(shortlist([base(),base()]).length,1);
 assert.equal(Object.hasOwn(shortlist([base()])[0],'price'),false);
});
test('evidence URL rejects credentials, fragments, whitespace and non-HTTPS',()=>{
 for (const url of ['https://user:pass@example.org/','https://example.org/#secret',
 'http://example.org/','https://example.org/ bad','javascript:alert(1)','https://']) {
  assert.equal(isSafeEvidenceUrl(url),false,url);
 }
 assert.equal(isSafeEvidenceUrl('https://datacvr.virk.dk/'),true);
});
test('CVR accepts only eight ASCII digits and rejects escaped digit text',()=>{
 assert.equal(isValidDanishCvr('10150817'),true);
 for (const value of ['\\d{8}','1015081x','10150817 ',' 10150817','١٠١٥٠٨١٧']) {
  assert.equal(isValidDanishCvr(value),false);
 }
});
