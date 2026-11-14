import test from 'node:test';
import assert from 'node:assert/strict';
import { compareVerifiedQuotes } from '../lib/ai-contractor-ranking.mjs';

const base = { sourceType: 'contractor_document', documentId: 'verified-quote', currency: 'DKK',
  scope: 'Maling', materials: 'Included', warranty: '2 years', validUntil: '2026-12-31', vatIncluded: true };

test('rejects numeric prices with fractional øre or unsafe magnitudes', () => {
  for (const totalPrice of [12.345, 0.001, 1e20, Number.MAX_SAFE_INTEGER, -0, Infinity, NaN]) {
    const [result] = compareVerifiedQuotes([{ ...base, totalPrice }]);
    assert.equal(result.comparable, false, String(totalPrice));
    assert.equal(result.verifiedPrice, null, String(totalPrice));
  }
});

test('preserves exact øre and integer DKK prices', () => {
  for (const totalPrice of [0, 0.01, 12.5, 12500.99, '12500.50']) {
    const [result] = compareVerifiedQuotes([{ ...base, totalPrice }]);
    assert.equal(result.comparable, true, String(totalPrice));
    assert.equal(result.verifiedPrice, Number(totalPrice));
  }
});
