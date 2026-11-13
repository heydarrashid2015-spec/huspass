import test from 'node:test';
import assert from 'node:assert/strict';
import { assessCvrRegistrySnapshot } from '../lib/ai-cvr-evidence-freshness.mjs';

const now = Date.parse('2026-11-13T00:00:00Z');
const record = (checkedAt) => ({ source: 'server_registry_lookup', verified: true, cvr: '10150817', active: true, checkedAt });

test('rejects impossible February date even if Date.parse normalizes it', () => {
  assert.equal(assessCvrRegistrySnapshot('10150817', record('2026-02-30T00:00:00Z'), {now}).reason, 'invalid_timestamp');
});
test('rejects April 31 rollover', () => {
  assert.equal(assessCvrRegistrySnapshot('10150817', record('2026-04-31T00:00:00Z'), {now}).reason, 'invalid_timestamp');
});
test('accepts a real leap day when within freshness window', () => {
  const leapNow = Date.parse('2028-03-01T00:00:00Z');
  assert.equal(assessCvrRegistrySnapshot('10150817', record('2028-02-29T00:00:00Z'), {now: leapNow}).accepted, true);
});
test('accepts valid milliseconds without weakening the date check', () => {
  assert.equal(assessCvrRegistrySnapshot('10150817', record('2026-11-12T12:00:00.123Z'), {now}).accepted, true);
});
