import test from 'node:test';
import assert from 'node:assert/strict';
import { assessCvrRegistrySnapshot } from '../lib/ai-cvr-evidence-freshness.mjs';

const now = Date.parse('2026-11-13T00:00:00Z');
const record = { source: 'server_registry_lookup', verified: true, cvr: '10150817', active: true, checkedAt: '2026-11-05T00:00:00Z' };

test('cannot extend CVR evidence validity beyond seven days', () => {
  assert.equal(assessCvrRegistrySnapshot('10150817', record, { now, maxAgeMs: 30 * 86400000 }).reason, 'invalid_clock');
});
test('rejects expired evidence even at maximum permitted age', () => {
  assert.equal(assessCvrRegistrySnapshot('10150817', record, { now, maxAgeMs: 7 * 86400000 }).reason, 'stale_or_future_evidence');
});
test('accepts exactly seven-day-old evidence with a valid server record', () => {
  const boundary = { ...record, checkedAt: '2026-11-06T00:00:00Z' };
  assert.equal(assessCvrRegistrySnapshot('10150817', boundary, { now, maxAgeMs: 7 * 86400000 }).accepted, true);
});
