import test from 'node:test';
import assert from 'node:assert/strict';
import { rankContractors } from '../lib/ai-contractor-ranking.mjs';

const project = { category: 'maling', postcode: '8000' };
const base = () => ({ name: 'Firma', sourceUrl: 'https://example.dk/evidence', services: ['maling'], servicePostcodes: ['8000'], cvr: '12345678' });

test('rejects contractor with inherited source URL', () => {
  const candidate = Object.assign(Object.create({ sourceUrl: 'https://example.dk/evidence' }), base());
  delete candidate.sourceUrl;
  assert.deepEqual(rankContractors([candidate], project), []);
});

test('rejects contractor with inherited service categories', () => {
  const candidate = Object.assign(Object.create({ services: ['maling'] }), base());
  delete candidate.services;
  assert.deepEqual(rankContractors([candidate], project), []);
});

test('inherited CVR verification cannot boost ranking', () => {
  const candidate = Object.assign(Object.create({ cvrVerified: true, specialismVerified: true }), base());
  const [result] = rankContractors([candidate], project);
  assert.equal(result.score, 75);
  assert.deepEqual(result.evidence, ['documented_service_area']);
});

test('own verified evidence remains eligible', () => {
  const [result] = rankContractors([{ ...base(), cvrVerified: true, specialismVerified: true }], project);
  assert.equal(result.score, 100);
});
