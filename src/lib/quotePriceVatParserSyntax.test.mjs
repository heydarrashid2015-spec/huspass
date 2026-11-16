import test from 'node:test';
import assert from 'node:assert/strict';
import { extractQuotePriceEvidence } from './quotePriceEvidence.mjs';

test('VAT evidence is unknown for two amounts on one line', () => {
  const values = extractQuotePriceEvidence('Materialer 1.000 kr, arbejde 2.000 kr inkl. moms');
  assert.equal(values.length, 2);
  assert.deepEqual(values.map(value => value.vatStatus), ['unknown', 'unknown']);
});

test('VAT evidence remains explicit for one amount', () => {
  const values = extractQuotePriceEvidence('Samlet 3.000 kr inkl. moms');
  assert.equal(values.length, 1);
  assert.equal(values[0].vatStatus, 'included');
});

test('VAT evidence on a different line must not leak into another amount', () => {
  const values = extractQuotePriceEvidence('Arbejde 2.000 kr\nMaterialer 3.000 kr inkl. moms');
  assert.deepEqual(values.map(value => value.vatStatus), ['unknown', 'included']);
});
