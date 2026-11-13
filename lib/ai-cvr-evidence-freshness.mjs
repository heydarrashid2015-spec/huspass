import { inspectDanishCvr } from './ai-cvr-format.mjs';

/**
 * Validate a registry snapshot obtained by a trusted server-side adapter.
 * This does NOT authenticate the record's origin: never pass browser-supplied
 * objects here, and never expose this as proof of a live registry lookup.
 */
export function assessCvrRegistrySnapshot(cvr, record, { now = Date.now(), maxAgeMs = 7 * 86400000 } = {}) {
  const input = inspectDanishCvr(cvr);
  if (!input.valid) return { accepted: false, reason: input.reason };
  if (!record || typeof record !== 'object' || Array.isArray(record)) return { accepted: false, reason: 'missing_registry_record' };
  if (record.source !== 'server_registry_lookup' || record.verified !== true) return { accepted: false, reason: 'untrusted_provenance' };
  if (record.cvr !== input.cvr) return { accepted: false, reason: 'cvr_mismatch' };
  if (record.active !== true) return { accepted: false, reason: 'inactive_company' };
  if (!Number.isFinite(now) || !Number.isFinite(maxAgeMs) || maxAgeMs <= 0) return { accepted: false, reason: 'invalid_clock' };
  if (typeof record.checkedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(record.checkedAt)) return { accepted: false, reason: 'missing_timestamp' };
  const checkedAt = Date.parse(record.checkedAt);
  if (!Number.isFinite(checkedAt) || new Date(checkedAt).toISOString() !== new Date(record.checkedAt).toISOString()) return { accepted: false, reason: 'invalid_timestamp' };
  if (checkedAt > now || now - checkedAt > maxAgeMs) return { accepted: false, reason: 'stale_or_future_evidence' };
  return { accepted: true, reason: null, cvr: input.cvr, checkedAt: record.checkedAt };
}
