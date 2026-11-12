import test from 'node:test';
import assert from 'node:assert/strict';
import { assessCvrRegistrySnapshot } from '../lib/ai-cvr-evidence-freshness.mjs';

const now = Date.parse('2026-11-13T00:00:00Z');
const record = { source: 'server_registry_lookup', verified: true, cvr: '10150817', active: true, checkedAt: '2026-11-12T00:00:00Z' };
const assess = (r, options = {}) => assessCvrRegistrySnapshot('10150817', r, { now, ...options });

test('accept recent matching server snapshot without claiming live lookup', () => {
  assert.deepEqual(assess(record), { accepted: true, reason: null, cvr: '10150817', checkedAt: record.checkedAt });
});
test('reject missing and browser asserted provenance', () => {
  assert.equal(assess(null).accepted, false);
  assert.equal(assess({ ...record, source: 'browser' }).reason, 'untrusted_provenance');
  assert.equal(assess({ ...record, verified: 'true' }).accepted, false);
});
test('reject mismatched or inactive CVR', () => {
  assert.equal(assess({ ...record, cvr: '13585628' }).reason, 'cvr_mismatch');
  assert.equal(assess({ ...record, active: false }).reason, 'inactive_company');
});
test('reject expired and future evidence', () => {
  assert.equal(assess({ ...record, checkedAt: '2026-11-01T00:00:00Z' }).reason, 'stale_or_future_evidence');
  assert.equal(assess({ ...record, checkedAt: '2026-11-14T00:00:00Z' }).reason, 'stale_or_future_evidence');
});
test('reject missing, malformed, and non-UTC timestamps', () => {
  for (const checkedAt of [undefined, '2026-11-12', '2026-11-12T00:00:00+01:00', 'not-a-date', '2026-02-30T00:00:00Z']) {
    assert.equal(assess({ ...record, checkedAt }).accepted, false);
  }
});
test('reject invalid clocks and check-digit inputs', () => {
  assert.equal(assess(record, { now: NaN }).reason, 'invalid_clock');
  assert.equal(assess(record, { maxAgeMs: 0 }).reason, 'invalid_clock');
  assert.equal(assessCvrRegistrySnapshot('12345678', record, { now }).accepted, false);
});
