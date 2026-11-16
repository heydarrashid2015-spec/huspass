import test from 'node:test';
import assert from 'node:assert/strict';
import { compareVerifiedQuotes } from '../lib/ai-contractor-ranking.mjs';

const base = { sourceType: 'contractor_document', documentId: 'quote-verified-1',
  currency: 'DKK', scope: 'Maling af vægge', materials: 'Maling inkluderet',
  warranty: '2 år', validUntil: '2026-12-31', vatIncluded: true };

test('accepts legitimate documented DKK decimal strings', () => {
  for (const [raw, expected] of [['12500.00', 12500], ['12500.50', 12500.5], ['0.99', 0.99], ['0', 0]]) {
    const [quote] = compareVerifiedQuotes([{ ...base, totalPrice: raw }]);
    assert.equal(quote.comparable, true, raw);
    assert.equal(quote.verifiedPrice, expected, raw);
  }
});

test('rejects malformed or ambiguous price strings without inventing a price', () => {
  for (const raw of ['12,500', '12.345', '1e3', '-5', '12abc', '', '  ', '1\\d', '01']) {
    const [quote] = compareVerifiedQuotes([{ ...base, totalPrice: raw }]);
    assert.equal(quote.comparable, false, JSON.stringify(raw));
    assert.equal(quote.verifiedPrice, null, JSON.stringify(raw));
  }
});
