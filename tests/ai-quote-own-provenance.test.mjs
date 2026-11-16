import test from 'node:test';
import assert from 'node:assert/strict';
import { compareVerifiedQuotes } from '../lib/ai-contractor-ranking.mjs';

const complete = { sourceType: 'contractor_document', documentId: 'doc-1',
  totalPrice: '12500.00', currency: 'DKK', scope: 'Painting', materials: 'Paint',
  warranty: '2 years', validUntil: '2026-12-31', vatIncluded: true };

test('accepts explicitly supplied documented quote terms', () => {
  const [result] = compareVerifiedQuotes([complete]);
  assert.equal(result.comparable, true);
  assert.equal(result.verifiedPrice, 12500);
});
test('rejects inherited provenance even with explicit commercial terms', () => {
  const quote = Object.assign(Object.create({ sourceType: 'contractor_document', documentId: 'doc-1' }), complete);
  delete quote.sourceType; delete quote.documentId;
  const [result] = compareVerifiedQuotes([quote]);
  assert.equal(result.comparable, false);
  assert.equal(result.verifiedPrice, null);
});
test('rejects inherited price and VAT evidence', () => {
  const quote = Object.assign(Object.create({ totalPrice: '12500.00', vatIncluded: true }), complete);
  delete quote.totalPrice; delete quote.vatIncluded;
  const [result] = compareVerifiedQuotes([quote]);
  assert.equal(result.comparable, false);
  assert.equal(result.verifiedPrice, null);
  assert.ok(result.missingFields.includes('vatIncluded'));
});
test('rejects inherited commercial terms', () => {
  const quote = Object.assign(Object.create({ warranty: '2 years' }), complete);
  delete quote.warranty;
  const [result] = compareVerifiedQuotes([quote]);
  assert.equal(result.comparable, false);
  assert.ok(result.missingFields.includes('warranty'));
});
test('does not crash or verify null and primitive quote entries', () => {
  for (const entry of [null, 3, 'bad']) {
    const [result] = compareVerifiedQuotes([entry]);
    assert.equal(result.comparable, false);
    assert.equal(result.verifiedPrice, null);
  }
});
