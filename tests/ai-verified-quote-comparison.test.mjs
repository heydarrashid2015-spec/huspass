import test from 'node:test';
import assert from 'node:assert/strict';
import { compareVerifiedContractorQuotes as compare } from '../lib/ai-verified-quote-comparison.mjs';

const q = (id, totalPrice, overrides = {}) => ({
  id, ownerId: 'owner-A', projectId: 'project-A', privateDocumentVerified: true,
  sourceType: 'contractor_document', documentId: 'document-' + id,
  contractorId: 'contractor-' + id, currency: 'DKK', totalPrice,
  vatIncluded: true, ...overrides
});
const run = quotes => compare({ quotes, authenticatedOwnerId: 'owner-A', authorizedProjectId: 'project-A' });

test('sorts two documented DKK quotes without inventing absent scope or warranty', () => {
  const result = run([q('a', 20000), q('b', 12500, { materials: 'Træ' })]);
  assert.equal(result.accepted, true);
  assert.deepEqual(result.comparisons.map(x => x.quoteId), ['b', 'a']);
  assert.equal(result.comparisons[0].warranty, null);
  assert.equal(result.comparisons[1].scope, null);
});
test('rejects cross-account quote and leaks no partial comparisons', () => {
  const result = run([q('a', 100), q('b', 200, { ownerId: 'owner-B' })]);
  assert.equal(result.accepted, false);
  assert.deepEqual(result.comparisons, []);
});
test('rejects mixed VAT basis instead of ranking misleading totals', () => {
  assert.equal(run([q('a', 100), q('b', 200, { vatIncluded: false })]).reason, 'incomparable_vat_basis');
});
test('rejects quotes without private document verification', () => {
  assert.equal(run([q('a', 100), q('b', 200, { privateDocumentVerified: false })]).accepted, false);
});
test('rejects duplicate quote IDs and missing evidence', () => {
  assert.equal(run([q('a', 100), q('a', 200)]).accepted, false);
  assert.equal(run([q('a', 100), q('b', 200, { documentId: '' })]).accepted, false);
});
test('rejects malformed price, currency and unsupported count', () => {
  assert.equal(run([q('a', NaN), q('b', 200)]).accepted, false);
  assert.equal(run([q('a', 100), q('b', 200, { currency: 'EUR' })]).accepted, false);
  assert.equal(run([q('a', 100)]).accepted, false);
});
test('rejects accessor properties without invoking getters', () => {
  let invoked = false;
  const unsafe = q('a', 100);
  Object.defineProperty(unsafe, 'totalPrice', { enumerable: true, get() { invoked = true; throw Error('getter'); } });
  assert.equal(run([unsafe, q('b', 200)]).accepted, false);
  assert.equal(invoked, false);
});
test('rejects unsupported or empty materials evidence', () => {
  assert.equal(run([q('a', 100, { materials: '' }), q('b', 200)]).accepted, false);
});

test('accepts ordinary Danish øre prices despite binary floating point', () => {
  const result = run([q('a', 0.29), q('b', 0.3)]);
  assert.equal(result.accepted, true);
  assert.deepEqual(result.comparisons.map(x => x.totalPrice), [0.29, 0.3]);
});
test('rejects fractional øre and amounts beyond safe integer minor units', () => {
  assert.equal(run([q('a', 0.291), q('b', 1)]).accepted, false);
  assert.equal(run([q('a', Number.MAX_SAFE_INTEGER), q('b', 1)]).accepted, false);
});
