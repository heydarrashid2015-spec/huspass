import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareContractorContact } from '../lib/ai-contractor-contact-consent.mjs';
const project = { id:'p1', customerId:'owner1', description:'Maling af stue', category:'maling', address:'PRIVATE', email:'private@example.dk' };
const contractor = { cvr:'12345678', cvrVerified:true };
const consent = { approved:true, purpose:'contractor_quote_request', customerId:'owner1', projectId:'p1', contractorCvrs:['12345678'], approvedAt:'2026-11-01T00:00:00Z', expiresAt:'2026-12-01T00:00:00Z' };
const args = { project, contractor, consent, now:'2026-11-15T00:00:00Z' };
test('requires explicit scoped consent and prevents cross-account and cross-project contact', () => {
 for (const overrides of [{consent:{...consent,approved:false}}, {consent:{...consent,customerId:'other'}}, {consent:{...consent,projectId:'other'}}, {consent:{...consent,contractorCvrs:['87654321']}}, {contractor:{...contractor,cvrVerified:false}}]) {
   assert.equal(prepareContractorContact({...args,...overrides}).allowed,false);
 }
});
test('rejects expired consent and inherited approval', () => {
 assert.equal(prepareContractorContact({...args,now:'2026-12-01T00:00:00Z'}).allowed,false);
 assert.equal(prepareContractorContact({...args,consent:Object.create(consent)}).allowed,false);
});
test('prepares minimal payload only after approval without leaking contact details', () => {
 const result=prepareContractorContact(args);
 assert.equal(result.allowed,true);
 assert.deepEqual(result.payload,{projectId:'p1',contractorCvr:'12345678',description:'Maling af stue',category:'maling'});
 assert.equal(JSON.stringify(result).includes('PRIVATE'),false);
});
