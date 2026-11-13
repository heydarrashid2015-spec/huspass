import test from 'node:test';
import assert from 'node:assert/strict';
import { assessCvrRegistrySnapshot } from '../lib/ai-cvr-evidence-freshness.mjs';

const now = Date.parse('2026-11-13T00:00:00Z');
const valid = { source: 'server_registry_lookup', verified: true, cvr: '10150817', active: true, checkedAt: '2026-11-12T00:00:00Z' };
const check = (checkedAt) => assessCvrRegistrySnapshot('10150817', { ...valid, checkedAt }, { now });

test('UTC timestamps with seconds and milliseconds pass syntax validation', () => {
  assert.equal(check('2026-11-12T00:00:00Z').accepted, true);
  assert.equal(check('2026-11-12T00:00:00.123Z').accepted, true);
});
test('literal backslash-d and timezone offsets are rejected', () => {
  assert.equal(check('2026-11-12T00:00:00+00:00').accepted, false);
  assert.equal(check('\\\\d{4}-11-12T00:00:00Z').accepted, false);
});
test('invalid calendar dates are rejected', () => {
  assert.equal(check('2026-02-30T00:00:00Z').accepted, false);
});
