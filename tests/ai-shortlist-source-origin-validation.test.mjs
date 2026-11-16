import test from 'node:test';
import assert from 'node:assert/strict';
import { rankContractors } from '../lib/ai-contractor-ranking.mjs';
const project = { category: 'maling', postcode: '2100' };
const candidate = { name: 'Eksempel Maler', cvr: '12345678', services: ['maling'], sourceUrl: 'https://example.dk/virksomhed', servicePostcodes: ['2100'] };
test('rejects malformed, credential-bearing, and local source URLs', () => {
  const invalid = ['https://', 'https://localhost/path', 'https://host.local/path', 'https://user:pass@example.dk/', 'https://127.0.0.1/path', 'https://[::1]/', 'http://example.dk/', 'https://example.dk'.padEnd(3000, 'a')];
  for (const sourceUrl of invalid) assert.deepEqual(rankContractors([{ ...candidate, sourceUrl }], project), [], sourceUrl.slice(0, 80));
});
test('preserves valid attributable HTTPS evidence', () => {
  const result = rankContractors([candidate], project);
  assert.equal(result.length, 1);
  assert.equal(result[0].sourceUrl, candidate.sourceUrl);
});
