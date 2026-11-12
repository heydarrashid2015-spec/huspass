import test from 'node:test';
import assert from 'node:assert/strict';
import { extractExplicitQuoteTotal as extract } from '../lib/ai/quote-total-extraction.mjs';
test('extracts explicit DKK total with line evidence', () => {
 const r = extract('Maling af stue\nI alt inkl. moms: 12.500,50 kr.');
 assert.equal(r.status, 'extracted_unverified');
 assert.deepEqual(r.candidates[0], {lineNumber:2,sourceLine:'I alt inkl. moms: 12.500,50 kr.',totalDkk:12500.5,currency:'DKK',vat:'included'});
});
test('does not invent missing total',()=>assert.equal(extract('Maling 100 kr. pr time').status,'unavailable'));
test('rejects ambiguous totals',()=>assert.equal(extract('I alt 100 kr.\nTotal 200 kr.').status,'ambiguous'));
test('does not silently infer VAT',()=>assert.equal(extract('Total DKK 900').candidates[0].vat,'unknown'));
test('rejects fractional øre',()=>assert.equal(extract('Total 100,123 kr.').status,'unavailable'));
test('rejects unlabelled price',()=>assert.equal(extract('DKK 300').status,'unavailable'));
test('rejects invalid and oversized input',()=>{assert.equal(extract(null).status,'unavailable');assert.equal(extract('x'.repeat(200001)).status,'unavailable');});
