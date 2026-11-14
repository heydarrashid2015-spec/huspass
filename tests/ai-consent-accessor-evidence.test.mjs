import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizeContractorOutreach } from '../lib/ai/contractor-outreach-consent.mjs';
const actorId = 'owner-1';
const project = {id:'home-1',ownerId:actorId};
const contractor = {id:'company-1',cvr:'01234567'};
const consent = {ownerId:actorId,projectId:project.id,contractorId:contractor.id,action:'request_quote',granted:true,grantedAt:new Date().toISOString(),revoked:false};
const authorize = (overrides={}) => authorizeContractorOutreach({actorId,project,contractor,consent,...overrides});
for (const [field,record,reason] of [['project',project,'project_access_denied'],['contractor',contractor,'contractor_unverified'],['consent',consent,'explicit_consent_required']]) {
 test('rejects accessor property on '+field+' without executing getter',()=>{
  let invoked = 0;
  const hostile = {...record};
  Object.defineProperty(hostile,Object.keys(record)[0],{enumerable:true,get(){invoked++;throw Error('getter executed')}});
  assert.deepEqual(authorize({[field]:hostile}),{allowed:false,reason});
  assert.equal(invoked,0);
 });
 test('rejects non-enumerable accessor on '+field+' without executing getter',()=>{
  let invoked = 0;
  const hostile = {...record};
  Object.defineProperty(hostile,'hidden',{get(){invoked++;return 'x'}});
  assert.deepEqual(authorize({[field]:hostile}),{allowed:false,reason});
  assert.equal(invoked,0);
 });
}
test('ordinary consent records remain valid',()=>{
 assert.deepEqual(authorize(),{allowed:true,reason:'consent_verified'});
});
