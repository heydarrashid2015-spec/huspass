import test from 'node:test';
import assert from 'node:assert/strict';
import { extractQuotePriceEvidence } from '../src/lib/quotePriceEvidence.mjs';

test('semicolon-separated VAT prefixes belong only to their own amount', () => {
  const rows = extractQuotePriceEvidence('inkl. moms: 1.250 kr; ekskl. moms: 800 kr; uden moms: 400 kr');
  assert.deepEqual(rows.map(row => row.amountDkk), [1250, 800, 400]);
  assert.deepEqual(rows.map(row => row.vatStatus), ['included', 'excluded', 'excluded']);
});

test('VAT suffix of a preceding amount does not label an unmarked next amount', () => {
  const rows = extractQuotePriceEvidence('Materialer 1.250 kr inkl. moms; Arbejde 800 kr');
  assert.deepEqual(rows.map(row => row.vatStatus), ['included', 'unknown']);
});
