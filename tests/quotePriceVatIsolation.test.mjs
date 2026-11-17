import test from 'node:test';
import assert from 'node:assert/strict';
import { extractQuotePriceEvidence } from '../src/lib/quotePriceEvidence.mjs';

// A contractor's quote must never acquire a VAT classification from an adjacent amount.
test('unmarked middle amount retains unknown VAT between explicit VAT prices', () => {
  const rows = extractQuotePriceEvidence('Materialer 1.250 kr ekskl. moms. Arbejde 800 kr. Samlet 2.562,50 kr inkl. moms.');
  assert.deepEqual(rows.map(row => row.amountDkk), [1250, 800, 2562.5]);
  assert.deepEqual(rows.map(row => row.vatStatus), ['excluded', 'unknown', 'included']);
});
