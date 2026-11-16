import test from 'node:test';
import assert from 'node:assert/strict';
import { extractQuotePriceEvidence } from './quotePriceEvidence.mjs';

test('malformed Danish numeric groups are not extracted as price suffixes', () => {
  for (const input of ['12.34 kr', '1,234 kr', '1.23.456 kr']) {
    assert.deepEqual(extractQuotePriceEvidence(input), [], input);
  }
});

test('valid Danish grouping and decimals remain extractable', () => {
  const result = extractQuotePriceEvidence('Arbejde 1.234,50 kr');
  assert.equal(result.length, 1);
  assert.equal(result[0].amountDkk, 1234.5);
});
