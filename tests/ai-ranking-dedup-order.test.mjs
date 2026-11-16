import test from 'node:test';
import assert from 'node:assert/strict';
import { rankContractors } from '../lib/ai-contractor-ranking.mjs';

const project = { category: 'maling', postcode: '8000' };
const candidate = (name, cvr, extra = {}) => ({ name, cvr, sourceUrl: 'https://example.dk/source', services: ['maling'], servicePostcodes: [], ...extra });

test('best evidenced entry wins for a duplicate CVR regardless of input order', () => {
  const weak = candidate('Weak', '12345678');
  const strong = candidate('Strong', '12345678', { cvrVerified: true, specialismVerified: true, servicePostcodes: ['8000'] });
  for (const records of [[weak, strong], [strong, weak]]) {
    const ranked = rankContractors(records, project);
    assert.equal(ranked.length, 1);
    assert.equal(ranked[0].name, 'Strong');
    assert.equal(ranked[0].score, 100);
    assert.equal(Object.hasOwn(ranked[0], 'dedupKey'), false);
  }
});

test('deduplication occurs before top-three limit', () => {
  const records = [candidate('Low', '12345678'), candidate('High', '12345678', { cvrVerified: true }), candidate('Other', '87654321')];
  assert.deepEqual(rankContractors(records, project, { limit: 2 }).map(c => c.name), ['High', 'Other']);
});
