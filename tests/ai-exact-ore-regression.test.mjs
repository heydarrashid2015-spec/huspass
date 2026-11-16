import test from 'node:test';
import assert from 'node:assert/strict';
import { compareVerifiedQuotes } from '../lib/ai-contractor-ranking.mjs';
const base = { sourceType: 'contractor_document', documentId: 'contractor-document-1', currency: 'DKK', scope: 'Maling', materials: 'Specified', warranty: '2 years', validUntil: '2026-12-31', vatIncluded: true };
test('rejects ambiguous numeric fractional øre rather than rounding', () => {
  for (const totalPrice of [0.1 + 0.2, 1.005, 12.345, 1e-7, 1e21, -0]) {
    const [quote] = compareVerifiedQuotes([{ ...base, totalPrice }]);
    assert.equal(quote.comparable, false, String(totalPrice));
    assert.equal(quote.verifiedPrice, null, String(totalPrice));
  }
});
test('accepts exact decimal øre strings', () => {
  for (const [totalPrice, expected] of [['0.30', 0.3], ['12500.50', 12500.5], ['0.01', 0.01]]) {
    const [quote] = compareVerifiedQuotes([{ ...base, totalPrice }]);
    assert.equal(quote.comparable, true, totalPrice);
    assert.equal(quote.verifiedPrice, expected, totalPrice);
  }
});
test('rejects unsafe øre and exponent notation', () => {
  for (const totalPrice of ['90071992547409.92', '1e3', '01.00', '-0.00', '12.345']) {
    const [quote] = compareVerifiedQuotes([{ ...base, totalPrice }]);
    assert.equal(quote.comparable, false, totalPrice);
  }
});
