import test from 'node:test';
import assert from 'node:assert/strict';
import { planContractorQuoteRequest as plan } from './contractor-quote-request-plan.mjs';
const now=1794800000000;
const base=()=>({ authenticatedOwnerId:'owner-a',project:{id:'project-a',ownerId:'owner-a'},
 contractor:{cvr:'12345678',verified:true,evidenceUrl:'https://datacvr.virk.dk/enhed/virksomhed/12345678'},
 consent:{status:'approved',ownerId:'owner-a',projectId:'project-a',contractorCvr:'12345678',grantedAt:now-1000,expiresAt:now+1000},
 now,message:'Please provide a written quotation for the kitchen.' });
test('prepares a scoped plan without sending or exposing consent',()=>{const r=plan(base());assert.equal(r.allowed,true);assert.deepEqual(Object.keys(r.request).sort(),['contractorCvr','message','projectId']);});
test('rejects foreign project even with approved consent',()=>{const x=base();x.project.ownerId='owner-b';assert.equal(plan(x).reason,'project_not_owned');});
test('rejects unverified CVR source and unverified contractor',()=>{const x=base();x.contractor.evidenceUrl='https://datacvr.virk.dk.evil.test/';assert.equal(plan(x).allowed,false);x.contractor.evidenceUrl='https://datacvr.virk.dk/enhed/virksomhed/12345678';x.contractor.verified=false;assert.equal(plan(x).allowed,false);});
test('rejects revoked consent and cross-contractor consent',()=>{const x=base();x.consent.status='revoked';assert.equal(plan(x).allowed,false);x.consent.status='approved';x.contractor.cvr='87654321';assert.equal(plan(x).allowed,false);});
test('rejects blank or oversized text',()=>{const x=base();x.message=' ';assert.equal(plan(x).allowed,false);x.message='a'.repeat(3001);assert.equal(plan(x).allowed,false);});
test('rejects getter-based untrusted project and contractor fields',()=>{const x=base();let calls=0;x.project={get id(){calls++;return 'project-a';},ownerId:'owner-a'};assert.equal(plan(x).allowed,false);assert.equal(calls,0);});

test('rejects official CVR evidence belonging to another company',()=>{const x=base();x.contractor.evidenceUrl='https://datacvr.virk.dk/enhed/virksomhed/87654321';assert.equal(plan(x).reason,'contractor_not_verified');});
test('rejects URL query, fragment and credentials in CVR evidence',()=>{for(const suffix of ['?redirect=1','#other']){const x=base();x.contractor.evidenceUrl+=suffix;assert.equal(plan(x).allowed,false);}const x=base();x.contractor.evidenceUrl='https://user@datacvr.virk.dk/enhed/virksomhed/12345678';assert.equal(plan(x).allowed,false);});
test('rejects malformed CVR and accepts exact official matching evidence',()=>{const x=base();x.contractor.cvr='123';assert.equal(plan(x).allowed,false);x.contractor.cvr='12345678';assert.equal(plan(x).allowed,true);});

test('rejects object and blank authentication or project identifiers',()=>{for(const value of [{id:'owner-a'},'','   ',42,null]){const x=base();x.authenticatedOwnerId=value;x.project.ownerId=value;assert.equal(plan(x).reason,'project_not_owned');}for(const value of [{id:'project-a'},'','  ',17,null]){const x=base();x.project.id=value;x.consent.projectId=value;assert.equal(plan(x).reason,'project_not_owned');}});
