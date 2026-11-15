import test from 'node:test';
import assert from 'node:assert/strict';
import {isValidDanishCvr,shortlistVerifiedContractors} from './danish-cvr-shortlist.mjs';
const cvr='10150817';
const base=(overrides={})=>({cvr,name:'Testfirma',registryVerified:true,registryStatus:'active',
 registryEvidenceUrl:'https://datacvr.virk.dk/',categories:['maling'],municipalities:['Aarhus'],
 verifiedRelevantJobs:3,...overrides});
test('CVR mod-11 checksum rejects invalid and malformed values',()=>{
 assert.equal(isValidDanishCvr(cvr),true);
 assert.equal(isValidDanishCvr('10150818'),false);
 assert.equal(isValidDanishCvr('DK10150817'),false);
 assert.equal(isValidDanishCvr(10150817),false);
});
test('shortlist requires matching area, trade, registry proof and active status',()=>{
 assert.equal(shortlistVerifiedContractors([base()],{category:'maling',municipality:'Aarhus'}).length,1);
 for(const change of [{registryVerified:false},{registryStatus:'inactive'},
  {registryEvidenceUrl:'http://example.org'},{municipalities:['Odense']},
  {categories:['have']},{verifiedRelevantJobs:undefined}]){
  assert.equal(shortlistVerifiedContractors([base(change)],{category:'maling',municipality:'Aarhus'}).length,0);
 }
});
test('deduplicates CVR and returns no more than three without inventing ranking evidence',()=>{
 const list=[base(),base({name:'duplicate'}),base({cvr:'10150818'})];
 const result=shortlistVerifiedContractors(list,{category:'maling',municipality:'Aarhus'});
 assert.equal(result.length,1);assert.equal(result[0].name,'Testfirma');
 assert.equal(Object.hasOwn(result[0],'price'),false);
});
