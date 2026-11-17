import test from 'node:test';
import assert from 'node:assert/strict';
import { extractQuotePriceEvidence } from '../src/lib/quotePriceEvidence.mjs';

test('a VAT note on a separate line does not silently certify the price', () => {
  const prices = extractQuotePriceEvidence('Arbejde: 12.500 kr\ninkl. moms');
  assert.equal(prices.length, 1);
  assert.equal(prices[0].amountDkk, 12500);
  assert.equal(prices[0].vatStatus, 'unknown');
});

test('a total label on a different line does not establish a verified total', () => {
  const prices = extractQuotePriceEvidence('Samlet\n12.500 kr');
  assert.equal(prices.length, 1);
  assert.equal(prices[0].isTotal, false);
});

test('amounts without a DKK currency token are not invented', () => {
  assert.deepEqual(extractQuotePriceEvidence('Pris 12.500 inkl. moms'), []);
});
