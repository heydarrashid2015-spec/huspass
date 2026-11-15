import test from 'node:test';
import assert from 'node:assert/strict';
import { compareVerifiedQuotes } from '../lib/ai-contractor-ranking.mjs';
const base = { sourceType: 'contractor_document', documentId: 'doc-1', currency: 'DKK', scope: 'Maling', materials: 'Paint', warranty: '2 years', validUntil: '2026-12-31', vatIncluded: true };
test('oversized attacker-controlled decimal quote is rejected without BigInt conversion', () => {
  const [quote] = compareVerifiedQuotes([{ ...base, totalPrice: '9'.repeat(100000) + '.00' }]);
  assert.equal(quote.comparable, false);
  assert.equal(quote.verifiedPrice, null);
  assert.equal(quote.warning, 'price_not_verified');
});
test('maximum safe øre and ordinary prices remain accepted', () => {
  for (const value of ['90071992547409.91', '12500.50', '0.01']) {
    const [quote] = compareVerifiedQuotes([{ ...base, totalPrice: value }]);
    assert.equal(quote.comparable, true, value);
  }
});
