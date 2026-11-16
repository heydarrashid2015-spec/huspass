import test from 'node:test';
import assert from 'node:assert/strict';
import { extractQuotePriceEvidence } from './quotePriceEvidence.mjs';

test('VAT remains unknown for two prices on the same line', () => {
  const prices = extractQuotePriceEvidence('Materialer 1.000 kr, arbejde 2.000 kr inkl. moms');
  assert.equal(prices.length, 2);
  assert.deepEqual(prices.map(p => p.vatStatus), ['unknown', 'unknown']);
});

test('single price retains explicit VAT evidence', () => {
  const prices = extractQuotePriceEvidence('Samlet 3.000 kr inkl. moms');
  assert.equal(prices.length, 1);
  assert.equal(prices[0].vatStatus, 'included');
});
