import test from 'node:test';
import assert from 'node:assert/strict';
import { extractContractorTotal } from '../lib/ai-quote-total-text.mjs';
test('extracts Danish explicit total and retains evidence', () => {
  assert.deepEqual(extractContractorTotal('Arbejdsbeskrivelse\\nI alt: 12.345,67 kr inkl. moms'), {
    status: 'found', price: 12345.67, currency: 'DKK', vat: 'included', evidence: 'I alt: 12.345,67 kr inkl. moms'
  });
});
test('rejects inferred totals from line items and arbitrary numbers', () => {
  assert.deepEqual(extractContractorTotal('Materialer 5000 kr\\nArbejde 8000 kr'), { status: 'not_found', price: null });
});
test('rejects ambiguous gross and net totals instead of selecting one', () => {
  assert.deepEqual(extractContractorTotal('Total: 10.000 kr ekskl. moms\\nI alt: 12.500 kr inkl. moms'), { status: 'ambiguous', price: null });
});
test('rejects mismatched duplicate totals', () => {
  assert.equal(extractContractorTotal('Total: 1.000 kr\\nTotal: 2.000 kr').status, 'ambiguous');
});
test('never treats an invalid or absent document as a quote', () => {
  assert.equal(extractContractorTotal(null).status, 'invalid_document');
  assert.equal(extractContractorTotal(' ').status, 'not_found');
});
test('does not interpret decimals with dots as Danish decimal prices', () => {
  assert.equal(extractContractorTotal('Total: 12.50 kr').status, 'not_found');
});
