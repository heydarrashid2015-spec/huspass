import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareQuoteComparison } from '../lib/ai-quote-comparison.mjs';
const ctx = {userId:'u1',projectId:'p1',scopeKey:'paint-100m2'};
const valid = (id, totalPrice, vatIncluded = true) => ({id,ownerId:'u1',projectId:'p1',contractorId:'c'+id,documentId:'d'+id,sourceType:'contractor_document',confirmedByContractor:true,totalPrice,currency:'DKK',vatIncluded,scope:'100m2 painting',scopeKey:'paint-100m2',materials:'paint included',warranty:'2 years',validUntil:'2027-01-01'});
test('sorts only two attributable same-scope offers', () => {
 const result=prepareQuoteComparison([valid('a',18000),valid('b',12000)],ctx);
 assert.equal(result.comparable,true); assert.deepEqual(result.offers.map(x=>x.totalPrice),[12000,18000]);
});
test('rejects other customer project quote', () => {
 const result=prepareQuoteComparison([{...valid('a',1000),ownerId:'u2'},valid('b',12000)],ctx);
 assert.equal(result.comparable,false); assert.deepEqual(result.rejected[0].reasons,['scope_mismatch']);
});
test('rejects extracted price not confirmed by contractor', () => {
 const result=prepareQuoteComparison([{...valid('a',9000),confirmedByContractor:false}],ctx);
 assert.ok(result.rejected[0].reasons.includes('not_contractor_confirmed'));
});
test('rejects guessed VAT and blank materials', () => {
 const result=prepareQuoteComparison([{...valid('a',9000),vatIncluded:null,materials:''}],ctx);
 assert.ok(result.rejected[0].reasons.includes('vat_unknown'));
 assert.ok(result.rejected[0].reasons.includes('materials_missing'));
});
test('does not compare mixed VAT bases', () => {
 const result=prepareQuoteComparison([valid('a',10000,true),valid('b',9000,false)],ctx);
 assert.equal(result.comparable,false); assert.equal(result.reason,'mixed_vat_basis');
});
test('rejects mismatched work scope and zero prices', () => {
 const result=prepareQuoteComparison([{...valid('a',0),scopeKey:'different'}],ctx);
 assert.ok(result.rejected[0].reasons.includes('scope_not_comparable'));
 assert.ok(result.rejected[0].reasons.includes('invalid_total'));
});
test('requires authenticated scope', () => {
 assert.throws(()=>prepareQuoteComparison([],{projectId:'p1'}));
});
