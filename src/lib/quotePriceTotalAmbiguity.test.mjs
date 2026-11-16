import test from 'node:test';
import assert from 'node:assert/strict';
import { extractQuotePriceEvidence } from './quotePriceEvidence.mjs';

test('does not label either price as total when line contains multiple prices', () => {
  const prices = extractQuotePriceEvidence('Materialer 1.000 kr, total: 2.000 kr');
  assert.equal(prices.length, 2);
  assert.ok(prices.every(price => price.isTotal === false));
});

test('preserves explicitly labelled total on a single-price line', () => {
  const prices = extractQuotePriceEvidence('Total: 2.000 kr inkl. moms');
  assert.equal(prices.length, 1);
  assert.equal(prices[0].isTotal, true);
  assert.equal(prices[0].vatStatus, 'included');
});

test('does not infer total across line boundaries', () => {
  const prices = extractQuotePriceEvidence('Total:\n2.000 kr');
  assert.equal(prices[0].isTotal, false);
});
