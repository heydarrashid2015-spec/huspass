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

test('rejects contact information embedded in free-text description or category', () => {
 for (const description of ['Maling; skriv til kunde@example.dk', 'Ring +45 12 34 56 78 om maling', 'telefon: 12345678']) {
   const result = prepareContractorContact({...args, project:{...project, description}});
   assert.equal(result.allowed, false);
   assert.equal(result.reason, 'personal_contact_in_project_text');
   assert.equal(result.payload, null);
 }
 const result = prepareContractorContact({...args, project:{...project, category:'mail owner@example.dk'}});
 assert.equal(result.allowed, false);
});
test('allows ordinary dimensions and work descriptions without contact details', () => {
 const result = prepareContractorContact({...args, project:{...project, description:'Mal 8 vægge på 45 m2'}});
 assert.equal(result.allowed, true);
});

test('rejects control characters in outbound text', () => {
 for (const description of ['Maling\nBcc: attacker@example.dk', 'Maling\rTil: anden', 'Maling\u0000af stue', 'Maling\tstue']) {
   const result = prepareContractorContact({...args, project:{...project, description}});
   assert.equal(result.allowed, false);
   assert.equal(result.reason, 'unsafe_project_text');
   assert.equal(result.payload, null);
 }
});
test('rejects malformed category and preserves ordinary category', () => {
 for (const category of ['maling\r\nX-Header: bad', 'x'.repeat(101), null]) {
   const result = prepareContractorContact({...args, project:{...project, category}});
   assert.equal(result.allowed, false);
   assert.equal(result.reason, 'unsafe_project_category');
 }
 assert.equal(prepareContractorContact(args).allowed, true);
});

test('rejects Unicode bidirectional and invisible format spoofing in outbound text', () => {
 for (const character of ['\u202E', '\u2066', '\u200B', '\uFEFF', '\u2028', '\u0085']) {
   const description = 'Mal' + character + 'ing af stue';
   const result = prepareContractorContact({...args, project:{...project, description}});
   assert.equal(result.allowed, false, 'description rejected for U+' + character.codePointAt(0).toString(16));
   assert.equal(result.reason, 'unsafe_project_text');
   assert.equal(result.payload, null);
   const categoryResult = prepareContractorContact({...args, project:{...project, category:'mal' + character + 'ing'}});
   assert.equal(categoryResult.allowed, false);
   assert.equal(categoryResult.reason, 'unsafe_project_category');
 }
});
test('preserves ordinary Danish Unicode characters in safe project descriptions', () => {
 const result = prepareContractorContact({...args, project:{...project, description:'Udskiftning af køkkenlåger på 12 m²', category:'køkken'}});
 assert.equal(result.allowed, true);
 assert.equal(result.payload.description, 'Udskiftning af køkkenlåger på 12 m²');
});

test('rejects compatibility Unicode obfuscation of embedded contact information', () => {
 for (const description of ['Kontakt kunde＠example．dk', 'telefon: １２３４５６７８', 'Ring ＋４５ １２ ３４ ５６ ７８']) {
   const result = prepareContractorContact({...args, project:{...project, description}});
   assert.equal(result.allowed, false, description);
   assert.equal(result.reason, 'personal_contact_in_project_text');
   assert.equal(result.payload, null);
 }
 const result = prepareContractorContact({...args, project:{...project, category:'mail kunde＠example．dk'}});
 assert.equal(result.allowed, false);
});

test('blocks unlabeled eight-digit Danish phone numbers without rejecting dimensions', () => {
 for (const description of ['Kontakt 12345678 vedrørende maling', 'Ring 12 34 56 78', 'Kontakt 12-34-56-78']) {
   const result = prepareContractorContact({...args, project:{...project, description}});
   assert.equal(result.allowed, false, description);
   assert.equal(result.reason, 'personal_contact_in_project_text');
   assert.equal(result.payload, null);
 }
 for (const description of ['Mal 8 vægge på 45 m2', 'Mal 123456789 m²']) {
   assert.equal(prepareContractorContact({...args, project:{...project, description}}).allowed, true, description);
 }
});
