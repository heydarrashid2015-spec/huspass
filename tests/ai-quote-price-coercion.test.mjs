import test from 'node:test';
import assert from 'node:assert/strict';
import { compareVerifiedQuotes } from '../lib/ai-contractor-ranking.mjs';

const quote = (totalPrice) => ({
  totalPrice, currency: 'DKK', sourceType: 'contractor_document', documentId: 'doc-owned-by-customer',
  scope: 'maling', materials: 'included', vatIncluded: true, warranty: '2 years', validUntil: '2026-12-01'
});

for (const value of [undefined, null, '', ' ', false, true, [], {}, 'not available', '1,000', '-1', '1e3']) {
  test('rejects non-document numeric price: ' + String(value), () => {
    const result = compareVerifiedQuotes([quote(value)])[0];
    assert.equal(result.comparable, false);
    assert.equal(result.verifiedPrice, null);
    assert.equal(result.warning, 'price_not_verified');
  });
}
test('accepts explicitly documented zero and decimal DKK values', () => {
  for (const value of [0, '0', '0.00', 1250.5, '1250.50']) {
    const result = compareVerifiedQuotes([quote(value)])[0];
    assert.equal(result.comparable, true);
    assert.equal(result.verifiedPrice, Number(value));
  }
});
test('rejects nonfinite numeric prices', () => {
  for (const value of [NaN, Infinity, -Infinity]) {
    assert.equal(compareVerifiedQuotes([quote(value)])[0].verifiedPrice, null);
  }
});
