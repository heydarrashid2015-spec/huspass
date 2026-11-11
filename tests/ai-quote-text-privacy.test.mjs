import test from 'node:test';
import assert from 'node:assert/strict';
import { screenContractorDescription } from '../lib/ai-quote-text-privacy.mjs';

test('ordinary project descriptions pass', () => {
  const r=screenContractorDescription('Jeg vil gerne male køkkenet og loftet.');
  assert.equal(r.safe,true);
});
test('email, phone, CPR and street address require review', () => {
  for (const value of [
    'Kontakt mig på owner@example.dk angående maling',
    'Ring til mig på +45 12 34 56 78 angående maling',
    'Mit CPR nummer er 010190-1234 til tilbuddet',
    'Vi bor på Søndergade 12 og vil male væggene'
  ]) assert.equal(screenContractorDescription(value).safe,false,value);
});
test('rejects empty and oversized descriptions', () => {
  assert.equal(screenContractorDescription(' ').safe,false);
  assert.equal(screenContractorDescription('x'.repeat(2001)).safe,false);
});
