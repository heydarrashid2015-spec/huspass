import test from 'node:test';
import assert from 'node:assert/strict';
import { extractQuotePriceEvidence } from '../src/lib/quotePriceEvidence.mjs';

test('extracts explicitly stated Danish prices and preserves provenance', () => {
 const rows = extractQuotePriceEvidence('Samlet: 12.500,50 kr inkl. moms. Materialer 2.000 DKK ekskl. moms.');
 assert.equal(rows.length, 2);
 assert.equal(rows[0].amountDkk, 12500.50);
 assert.equal(rows[0].vatStatus, 'included');
 assert.equal(rows[0].isTotal, true);
 assert.equal(rows[1].amountDkk, 2000);
 assert.equal(rows[1].vatStatus, 'excluded');
 assert.equal(rows[1].source, 'contractor_text');
});
test('does not invent VAT or totals', () => {
 const rows = extractQuotePriceEvidence('Arbejde 900 kr');
 assert.equal(rows.length, 1);
 assert.equal(rows[0].vatStatus, 'unknown');
 assert.equal(rows[0].isTotal, false);
});
test('rejects unpriced, negative, malformed and excessive input', () => {
 assert.deepEqual(extractQuotePriceEvidence('Ring for pris'), []);
 assert.deepEqual(extractQuotePriceEvidence('-500 kr'), []);
 assert.deepEqual(extractQuotePriceEvidence('x'.repeat(50001)), []);
 assert.deepEqual(extractQuotePriceEvidence(null), []);
});
