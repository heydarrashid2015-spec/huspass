import test from 'node:test';
import assert from 'node:assert/strict';
import { extractQuotePriceEvidence } from './quotePriceEvidence.mjs';

test('negative amounts with spaced or Unicode minus signs are not quote prices', () => {
  for (const sign of ['-', '−', '–', '—']) {
    assert.deepEqual(extractQuotePriceEvidence('Fradrag ' + sign + ' 1.200 kr'), []);
  }
});

test('a positive amount after a negative line remains extractable', () => {
  const prices = extractQuotePriceEvidence('Fradrag − 500 kr\\nArbejde 1.200 kr'.replace('\\n', '\n'));
  assert.equal(prices.length, 1);
  assert.equal(prices[0].amountDkk, 1200);
});
