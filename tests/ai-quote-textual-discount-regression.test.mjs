import test from 'node:test';
import assert from 'node:assert/strict';
import { extractQuotePriceEvidence } from '../src/lib/quotePriceEvidence.mjs';

test('does not treat labelled deductions as payable prices', () => {
  for (const label of ['Rabat 1.200 kr', 'Fradrag: 500 kr', 'Minus 200 kr', 'Besparelse på 750 kr']) {
    assert.deepEqual(extractQuotePriceEvidence(label), [], label);
  }
});

test('keeps actual quote prices separate from discounts', () => {
  const values = extractQuotePriceEvidence('Arbejde 5.000 kr\nRabat 500 kr\nTotal: 4.500 kr');
  assert.deepEqual(values.map(v => v.amountDkk), [5000, 4500]);
  assert.equal(values[1].isTotal, true);
});

test('does not discard normal descriptive prices', () => {
  assert.deepEqual(extractQuotePriceEvidence('Maling og materialer 2.000 kr').map(v => v.amountDkk), [2000]);
});
