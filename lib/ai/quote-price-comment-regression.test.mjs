import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { selectUnambiguousQuotePrice } from './quote-price-evidence.mjs';

test('boundary guard remains executable rather than hidden in a comment', () => {
  const source = readFileSync(new URL('./quote-price-evidence.mjs', import.meta.url), 'utf8');
  assert.match(source, /^\s*const before = text\[match\.index - 1\]/m);
  assert.match(source, /^\s*const after = text\[match\.index \+ match\[0\]\.length\]/m);
  assert.match(source, /^\s*if \(\/\[\\d\.,\]\/\.test\(before\)/m);
});

test('rejects malformed amount fragments on both sides of currency token', () => {
  for (const input of ['DKK 12.34', '12.34 kr', 'DKK 1,234', '1,234 kr']) {
    assert.equal(selectUnambiguousQuotePrice(input).status, 'missing', input);
  }
});
