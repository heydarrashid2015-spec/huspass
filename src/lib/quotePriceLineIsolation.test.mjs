import test from 'node:test';
import assert from 'node:assert/strict';
import { extractQuotePriceEvidence } from './quotePriceEvidence.mjs';

test('VAT on another line is not attributed to a price', () => {
  const prices = extractQuotePriceEvidence('Arbejde 1.200 kr\nMaterialer ekskl. moms');
  assert.equal(prices.length, 1);
  assert.equal(prices[0].vatStatus, 'unknown');
});

test('total on another line is not attributed to a price', () => {
  const prices = extractQuotePriceEvidence('I alt:\nArbejde 1.200 kr');
  assert.equal(prices[0].isTotal, false);
});

test('VAT and total on same line remain evidenced', () => {
  const prices = extractQuotePriceEvidence('I alt: 1.200 kr inkl. moms');
  assert.equal(prices[0].vatStatus, 'included');
  assert.equal(prices[0].isTotal, true);
});
