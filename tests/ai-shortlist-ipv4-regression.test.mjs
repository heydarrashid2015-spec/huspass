import test from 'node:test';
import assert from 'node:assert/strict';
import { isSafeEvidenceUrl } from '../lib/ai-verified-contractor-shortlist.mjs';

test('IPv4 literals are rejected regardless of address range', () => {
  for (const host of ['8.8.8.8', '1.1.1.1', '127.0.0.1', '192.168.1.1']) {
    assert.equal(isSafeEvidenceUrl('https://' + host + '/proof'), false, host);
  }
});

test('normal HTTPS host remains syntactically eligible, not verified', () => {
  assert.equal(isSafeEvidenceUrl('https://datacvr.virk.dk/'), true);
});
