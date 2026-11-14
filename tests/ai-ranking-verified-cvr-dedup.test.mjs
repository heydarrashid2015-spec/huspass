import test from 'node:test';
import assert from 'node:assert/strict';
import { rankContractors } from '../lib/ai-contractor-ranking.mjs';

const project = { category: 'maling', postcode: '8000' };
const contractor = (name, cvr, cvrVerified) => ({
  name, cvr, cvrVerified, sourceUrl: 'https://example.dk/evidence',
  services: ['maling'], servicePostcodes: ['8000']
});

test('malformed CVRs do not collapse distinct companies into one record', () => {
  const result = rankContractors([
    contractor('Alpha', 'not-a-cvr', false),
    contractor('Beta', 'also-invalid', false)
  ], project);
  assert.deepEqual(result.map(c => c.name), ['Alpha', 'Beta']);
});

test('unverified identical CVR does not assert a common legal identity', () => {
  const result = rankContractors([
    contractor('Alpha', '12345678', false),
    contractor('Beta', '12345678', false)
  ], project);
  assert.equal(result.length, 2);
});

test('verified identical CVR deduplicates to the strongest candidate', () => {
  const weak = contractor('Alpha', '12345678', true);
  const strong = { ...contractor('Beta', '12345678', true), specialismVerified: true };
  assert.deepEqual(rankContractors([weak, strong], project).map(c => c.name), ['Beta']);
});

test('unverified CVR cannot collide with verified CVR identity', () => {
  const result = rankContractors([
    contractor('Alpha', '12345678', false),
    contractor('Beta', '12345678', true)
  ], project);
  assert.equal(result.length, 2);
});
