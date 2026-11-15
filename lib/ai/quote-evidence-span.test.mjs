import test from 'node:test';
import assert from 'node:assert/strict';
import { validateQuotedPriceSpan } from './quote-evidence-span.mjs';

test('preserves exact Danish price and source offsets', () => {
  const text = 'Tilbud: 1.234,50 kr. inkl. moms';
  const literal = '1.234,50 kr.';
  const start = text.indexOf(literal);
  assert.deepEqual(validateQuotedPriceSpan(text, {start, end:start+literal.length, literal}),
    {literal, start, end:start+literal.length, ore:'123450'});
});

test('rejects fabricated, shifted and partial price evidence', () => {
  const source = 'Total 1234,50 DKK';
  assert.equal(validateQuotedPriceSpan(source, {start:6,end:17,literal:'9999,50 DKK'}), null);
  assert.equal(validateQuotedPriceSpan(source, {start:7,end:18,literal:'234,50 DKK'}), null);
  assert.equal(validateQuotedPriceSpan(source, {start:6,end:10,literal:'1234'}), null);
});

test('rejects ambiguous grouping, negative values and dimensions', () => {
  for (const literal of ['1.23,50 kr.', '-20 kr.', '2,5 kr.', '45 m2', '0012 kr.']) {
    assert.equal(validateQuotedPriceSpan(literal, {start:0,end:literal.length,literal}), null);
  }
});

test('does not trust coerced offsets or oversized source', () => {
  assert.equal(validateQuotedPriceSpan('20 kr.', {start:'0',end:6,literal:'20 kr.'}), null);
  assert.equal(validateQuotedPriceSpan('x'.repeat(100001), {start:0,end:6,literal:'20 kr.'}), null);
});

test('recognizes explicit Danish kroner without treating numeric dimensions as prices', () => {
  for (const [literal, ore] of [['0 kr.', '0'], ['99,05 DKK', '9905'], ['12.345.678,90 kr.', '1234567890']]) {
    assert.equal(validateQuotedPriceSpan(literal, {start:0,end:literal.length,literal})?.ore, ore);
  }
  for (const literal of ['12\\d kr.', '1.234,5 kr.', '12.34 kr.', '1200 m2']) {
    assert.equal(validateQuotedPriceSpan(literal, {start:0,end:literal.length,literal}), null);
  }
});

test('rejects currency fragments embedded in identifiers and words', () => {
  for (const [source, literal] of [
    ['abc20 kr.', '20 kr.'],
    ['+20 kr.', '20 kr.'],
    ['20 kr.abc', '20 kr.'],
    ['20 DKKextra', '20 DKK'],
    ['id_20 kr.', '20 kr.'],
  ]) {
    const start = source.indexOf(literal);
    assert.equal(validateQuotedPriceSpan(source, { start, end: start + literal.length, literal }), null);
  }
  const source = 'Pris (20 kr.) inklusive moms';
  const literal = '20 kr.';
  const start = source.indexOf(literal);
  assert.equal(validateQuotedPriceSpan(source, { start, end: start + literal.length, literal })?.ore, '2000');
});
