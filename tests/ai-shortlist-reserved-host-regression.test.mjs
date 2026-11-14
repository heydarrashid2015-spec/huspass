import test from 'node:test';
import assert from 'node:assert/strict';
import { isSafeEvidenceUrl } from '../lib/ai-verified-contractor-shortlist.mjs';

test('reserved suffixes and local evidence hosts are rejected', () => {
  for (const host of ['company.localhost', 'proof.local', 'api.internal', 'firm.test', 'data.invalid', 'company.example', 'example.com']) {
    assert.equal(isSafeEvidenceUrl(`https://${host}/proof`), false, host);
  }
});

test('normal HTTPS host is syntactically eligible, not verified', () => {
  assert.equal(isSafeEvidenceUrl('https://datacvr.virk.dk/'), true);
});
