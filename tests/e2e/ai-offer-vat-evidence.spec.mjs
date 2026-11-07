import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('offer VAT inference is anchored to the unique total price line', () => {
  const source = readFileSync(new URL('../../app/page.js', import.meta.url), 'utf8');
  expect(source).toContain('const priceEvidenceLine=unique.length===1?');
  expect(source).toContain('const linkedVatLine=priceEvidenceLine&&');
  expect(source).toContain('setOfferVat(vatStatus)');
  expect(source).toContain('setOfferVatEvidence(linkedVatLine?');
  expect(source).toContain('Vælg momsstatus manuelt ud fra originalen.');
  expect(source).not.toContain('setOfferVat(incl&&!excl?"yes":excl&&!incl?"no":"")');
});
