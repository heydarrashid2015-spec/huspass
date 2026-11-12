import test from 'node:test';
import assert from 'node:assert/strict';
import { extractDkkTotalEvidence } from '../lib/ai-quote-price-evidence.mjs';

test('extracts explicitly labelled Danish total and evidence', () => {
 const [x] = extractDkkTotalEvidence('Arbejde 500 kr.\nSamlet pris: 12.500,00 kr. inkl. moms');
 assert.equal(x.amount, 12500); assert.equal(x.vat, 'included'); assert.equal(x.evidence.line, 2); assert.equal(x.verified, false);
});
test('does not invent a total from line items', () => {
 assert.deepEqual(extractDkkTotalEvidence('Materialer 1.500 kr.\nTimer 2.000 kr.'), []);
});
test('ambiguous totals are withheld', () => {
 assert.deepEqual(extractDkkTotalEvidence('Total 2.000 kr. eller 3.000 kr.'), []);
});
test('VAT is unknown without explicit wording', () => {
 assert.equal(extractDkkTotalEvidence('Tilbudspris: DKK 4500')[0].vat, 'unknown');
});
test('zero and nonpositive values are not accepted as contractor quotes', () => {
 assert.deepEqual(extractDkkTotalEvidence('Total: 0 kr.'), []);
});
