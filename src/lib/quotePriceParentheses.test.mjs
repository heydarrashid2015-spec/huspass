import test from 'node:test';
import assert from 'node:assert/strict';
import { extractQuotePriceEvidence } from './quotePriceEvidence.mjs';

test('accounting-style negative amount is not treated as a positive quote', () => {
  assert.deepEqual(extractQuotePriceEvidence('Fradrag (1.234 kr)'), []);
});

test('ordinary positive quote is still extracted alongside parenthesized deduction', () => {
  const prices = extractQuotePriceEvidence('Arbejde 2.000 kr\nRabat (200 kr)');
  assert.deepEqual(prices.map(p => p.amountDkk), [2000]);
});

test('parenthetical descriptive text without enclosing currency remains valid', () => {
  const prices = extractQuotePriceEvidence('(arbejde) 2.000 kr');
  assert.equal(prices.length, 1);
});
