import test from 'node:test';
import assert from 'node:assert/strict';
import { selectUnambiguousQuotePrice } from './quote-price-evidence.mjs';

test('Danish grouped amounts with nonbreaking spaces preserve exact evidence offsets', () => {
  for (const separator of ['\u00a0', '\u202f']) {
    const input = 'Tilbud: 12' + separator + '500,50 kr inkl. moms';
    const result = selectUnambiguousQuotePrice(input);
    assert.equal(result.status, 'candidate_unverified');
    assert.equal(result.price.amountDkk, 12500.5);
    assert.equal(input.slice(result.price.start, result.price.end), result.price.evidence);
    assert.equal(result.price.vatIncluded, null, 'VAT must not be inferred from surrounding prose');
  }
});

test('rejects malformed nonbreaking-space groups rather than truncating the price', () => {
  for (const separator of ['\u00a0', '\u202f']) {
    for (const input of ['DKK 12' + separator + '50', '12' + separator + '50 kr']) {
      assert.equal(selectUnambiguousQuotePrice(input).status, 'missing', input);
    }
  }
});
