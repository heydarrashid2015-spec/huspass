import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareContractorContact } from '../lib/ai-contractor-consent.mjs';
const base = () => ({project:{id:'p1',description:'Paint interior walls and ceiling',category:'maling',address:'PRIVATE'},contractor:{id:'c1'},authenticatedUserId:'u1',ownerUserId:'u1',consent:{id:'cons1',granted:true,projectId:'p1',contractorId:'c1',userId:'u1',grantedAt:'2026-11-11T12:00:00Z'},now:new Date('2026-11-11T13:00:00Z')});
test('specific unexpired owner consent creates minimal contact payload',()=>{const result=prepareContractorContact(base());assert.equal(result.allowed,true);assert.equal(result.request.description,'Paint interior walls and ceiling');assert.equal(result.request.address,undefined);assert.equal(result.request.email,undefined);});
test('another user cannot authorize contractor contact',()=>{const x=base();x.authenticatedUserId='u2';assert.equal(prepareContractorContact(x).allowed,false);});
test('consent cannot be reused for another contractor',()=>{const x=base();x.contractor.id='c2';assert.equal(prepareContractorContact(x).reason,'specific_consent_required');});
test('revoked, used and expired consent are rejected',()=>{for(const key of ['revokedAt','usedAt']){const x=base();x.consent[key]='2026-11-11T12:30:00Z';assert.equal(prepareContractorContact(x).allowed,false);}const x=base();x.now=new Date('2026-11-13T13:00:00Z');assert.equal(prepareContractorContact(x).allowed,false);});
test('empty or invalid description cannot be sent',()=>{const x=base();x.project.description='';assert.equal(prepareContractorContact(x).allowed,false);});
