import test from 'node:test';
import assert from 'node:assert/strict';
import { extractQuotePriceEvidence } from './quotePriceEvidence.mjs';

test('accepts Danish NBSP and narrow NBSP thousands separators', () => {
  for (const space of ['\u00a0', '\u202f']) {
    const input = 'Samlet: 12' + space + '500,50 kr inkl. moms';
    const prices = extractQuotePriceEvidence(input);
    assert.equal(prices.length, 1, JSON.stringify(input));
    assert.equal(prices[0].amountDkk, 12500.5);
    assert.equal(prices[0].vatStatus, 'included');
  }
});

test('rejects malformed spaced numbers instead of extracting suffix', () => {
  for (const input of ['12\u00a034 kr', '12\u202f34 kr']) {
    assert.deepEqual(extractQuotePriceEvidence(input), []);
  }
});
