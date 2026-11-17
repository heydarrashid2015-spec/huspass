import test from 'node:test';
import assert from 'node:assert/strict';
import { extractQuotePriceEvidence } from './quotePriceEvidence.mjs';

test('negated VAT inclusion is not misread as included', () => {
  for (const text of ['Arbejde 12.000 kr ikke inkl. moms', 'Arbejde 12.000 kr ej inklusive moms', 'Arbejde 12.000 kr ikke med moms']) {
    const prices = extractQuotePriceEvidence(text);
    assert.equal(prices.length, 1, text);
    assert.equal(prices[0].vatStatus, 'unknown', text);
  }
});

test('affirmative inclusion remains recognized', () => {
  assert.equal(extractQuotePriceEvidence('Arbejde 12.000 kr inkl. moms')[0].vatStatus, 'included');
});
