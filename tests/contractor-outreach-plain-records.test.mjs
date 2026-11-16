import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizeContractorOutreach } from '../lib/ai/contractor-outreach-consent.mjs';
const actorId = 'owner-1';
const project = {id:'home-1',ownerId:actorId};
const contractor = {id:'company-1',cvr:'01234567'};
const consent = {ownerId:actorId,projectId:project.id,contractorId:contractor.id,action:'request_quote',granted:true,grantedAt:new Date().toISOString(),revoked:false};
const authorize = (overrides={}) => authorizeContractorOutreach({actorId,project,contractor,consent,...overrides});
for (const [field,record,reason] of [['project',project,'project_access_denied'],['contractor',contractor,'contractor_unverified'],['consent',consent,'explicit_consent_required']]) {
 test('rejects class instances as '+field+' authorization evidence', () => {
  class ForgedRecord { constructor() {Object.assign(this,record)} }
  assert.deepEqual(authorize({[field]:new ForgedRecord()}),{allowed:false,reason});
 });
 test('accepts null-prototype plain '+field+' records', () => {
  assert.deepEqual(authorize({[field]:Object.assign(Object.create(null),record)}),{allowed:true,reason:'consent_verified'});
 });
}
test('plain records still authorize without contacting a contractor',()=>{
 assert.deepEqual(authorize(),{allowed:true,reason:'consent_verified'});
});
