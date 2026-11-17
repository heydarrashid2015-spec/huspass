import test from 'node:test';
import assert from 'node:assert/strict';
import { extractQuotePriceEvidence } from '../src/lib/quotePriceEvidence.mjs';

test('small and fullwidth minus signs cannot become positive contractor prices', () => {
  for (const minus of ['\uFE63', '\uFF0D']) {
    assert.deepEqual(extractQuotePriceEvidence('Rabat: ' + minus + ' 1.234 kr'), []);
  }
});

test('a genuine price remains extractable beside a Unicode negative discount', () => {
  const prices = extractQuotePriceEvidence('Pris: 8.500 kr\nRabat: \uFF0D 1.000 kr');
  assert.deepEqual(prices.map(p => p.amountDkk), [8500]);
});
