import test from 'node:test';
import assert from 'node:assert/strict';
import { qualifyQuoteWithContext } from '../lib/ai/quote-context-qualification.mjs';

test('retains exact documented price and original line when firm', () => {
  const result = qualifyQuoteWithContext('Maling af stue\nI alt inkl. moms: 12.500,50 kr.\nBetaling efter udførelse');
  assert.equal(result.status, 'extracted_unverified');
  assert.equal(result.candidates[0].totalDkk, 12500.5);
  assert.equal(result.candidates[0].lineNumber, 2);
  assert.equal(result.candidates[0].vat, 'included');
});
for (const disclaimer of [
  'Prisen er vejledende', 'Dette er et uforbindende tilbud',
  'Foreløbig pris', 'Prisen er et overslag', 'Med forbehold for opmåling',
  'Materialer afregnes særskilt', 'Prisen kan ændres'
]) {
  test('rejects adjacent non-binding terms: ' + disclaimer, () => {
    const result = qualifyQuoteWithContext(disclaimer + '\nI alt inkl. moms: 12.000 kr.');
    assert.equal(result.status, 'unavailable');
    assert.equal(result.reason, 'nearby_non_firm_terms');
    assert.deepEqual(result.candidates, []);
  });
}
test('rejects disclaimer following the total', () => {
  assert.equal(qualifyQuoteWithContext('Total: 900 kr.\nPrisen er vejledende').status, 'unavailable');
});
test('does not use remote disclaimer to invalidate a separate quote section', () => {
  const text = 'Gammelt overslag\nAfsnit\nAfsnit\nAfsnit\nTotal: 900 kr.';
  assert.equal(qualifyQuoteWithContext(text).status, 'extracted_unverified');
});
test('does not guess if there are multiple totals', () => {
  assert.equal(qualifyQuoteWithContext('Total 900 kr.\nTotal 1000 kr.').status, 'ambiguous');
});
test('does not infer VAT', () => {
  assert.equal(qualifyQuoteWithContext('Total 900 kr.').candidates[0].vat, 'unknown');
});
test('rejects unsupported text', () => {
  assert.equal(qualifyQuoteWithContext('Pris aftales senere').status, 'unavailable');
});
