import test from 'node:test';
import assert from 'node:assert/strict';
import { qualifyQuoteTotal } from '../lib/ai/quote-total-qualification.mjs';

test('preserves exact explicit total and evidence', () => {
 const result = qualifyQuoteTotal('Maling\nI alt inkl. moms: 12.500,50 kr.');
 assert.equal(result.status, 'extracted_unverified');
 assert.equal(result.candidates[0].lineNumber, 2);
 assert.equal(result.candidates[0].totalDkk, 12500.5);
});
for (const line of [
 'Total fra 12.000 kr.', 'Total ca. 12.000 kr.',
 'Total overslag 12.000 kr.', 'Total op til 12.000 kr.',
 'Total 12.000-15.000 kr.', 'Total -100 kr.',
 'Total 500 kr. pr time'
]) test('does not treat non-firm quote as firm: '+line, () => {
 assert.equal(qualifyQuoteTotal(line).status, 'unavailable');
});
test('does not resolve multiple totals by guessing', () => {
 assert.equal(qualifyQuoteTotal('Total 100 kr.\nTotal 200 kr.').status, 'ambiguous');
});
test('never infers unknown VAT', () => {
 assert.equal(qualifyQuoteTotal('Total DKK 900').candidates[0].vat, 'unknown');
});
