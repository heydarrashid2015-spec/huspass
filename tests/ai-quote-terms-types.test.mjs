import test from 'node:test';
import assert from 'node:assert/strict';
import { compareVerifiedQuotes } from '../lib/ai-contractor-ranking.mjs';

const valid = () => ({
  totalPrice: 12500, currency: 'DKK', sourceType: 'contractor_document',
  documentId: 'test-document-only', scope: 'Maling af vægge',
  materials: 'Maling inkluderet', vatIncluded: true,
  warranty: '2 år', validUntil: '2026-12-01'
});

test('complete explicit terms are comparable', () => {
  assert.equal(compareVerifiedQuotes([valid()])[0].comparable, true);
});
test('explicit VAT exclusion is valid information, not a missing field', () => {
  assert.equal(compareVerifiedQuotes([{...valid(), vatIncluded: false}])[0].comparable, true);
});
for (const value of [undefined, null, '', ' ', 'unknown', 'true', 1, 0]) {
  test('VAT must be explicitly boolean: ' + String(value), () => {
    const result = compareVerifiedQuotes([{...valid(), vatIncluded: value}])[0];
    assert.equal(result.comparable, false);
    assert.ok(result.missingFields.includes('vatIncluded'));
  });
}
for (const field of ['scope', 'materials', 'warranty', 'validUntil']) {
  for (const value of [' ', false, 0, {}, []]) {
    test(field + ' rejects empty or non-text term: ' + String(value), () => {
      const result = compareVerifiedQuotes([{...valid(), [field]: value}])[0];
      assert.equal(result.comparable, false);
      assert.ok(result.missingFields.includes(field));
      assert.equal(result.warning, 'terms_incomplete');
    });
  }
}
