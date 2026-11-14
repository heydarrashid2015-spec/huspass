import test from 'node:test';
import assert from 'node:assert/strict';
import { isSafeEvidenceUrl } from '../lib/ai-verified-contractor-shortlist.mjs';

test('rejects local and IP literal evidence hosts', () => {
  for (const host of ['localhost', 'localhost.local', 'registry.internal', 'example.test', 'example.invalid', 'example.com', '127.0.0.1', '192.168.1.1', '[::1]', '[2001:db8::1]']) {
    assert.equal(isSafeEvidenceUrl('https://' + host + '/company'), false, host);
  }
});

test('allows ordinary HTTPS evidence hosts without treating them as verified', () => {
  assert.equal(isSafeEvidenceUrl('https://datacvr.virk.dk/'), true);
  assert.equal(isSafeEvidenceUrl('https://firma.dk/arbejde'), true);
});
