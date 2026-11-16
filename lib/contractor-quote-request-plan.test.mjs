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

test('rejects invisible control and bidirectional override characters in quote text',()=>{for(const char of ['\u0000','\u001b','\u007f','\u0085','\u202e','\u2066']){const x=base();x.message='Please quote '+char+' kitchen renovation';assert.equal(plan(x).reason,'invalid_request_text');}});
test('allows readable line breaks and tabs in quote text',()=>{const x=base();x.message='Please quote:\nKitchen renovation\twith materials';assert.equal(plan(x).allowed,true);});

test('rejects zero-width format characters that can disguise contractor request text',()=>{for(const char of ['\u200b','\u200c','\u200d','\u200e','\u200f','\u2060','\ufeff']){const x=base();x.message='Please quote '+char+' kitchen renovation';assert.equal(plan(x).reason,'invalid_request_text');}});
test('allows normal Danish quotation text',()=>{const x=base();x.message='Tilbud på køkkenrenovering inkl. materialer og moms';assert.equal(plan(x).allowed,true);});

test('rejects a too-short request padded with whitespace',()=>{const x=base();x.message='Quote me '+ ' '.repeat(20);assert.equal(plan(x).reason,'invalid_request_text');});
test('accepts a 10-character descriptive request after trimming',()=>{const x=base();x.message='  Mal køkken  ';assert.equal(plan(x).allowed,true);assert.equal(plan(x).request.message,'Mal køkken');});\ntest('rejects numeric-only or punctuation-padded requests',()=>{for(const message of ['1234567890','1234567890!!!','12 .............']){const x=base();x.message=message;assert.equal(plan(x).reason,'invalid_request_text');}});
