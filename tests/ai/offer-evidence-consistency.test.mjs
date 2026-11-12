import test from 'node:test';
import assert from 'node:assert/strict';
import { assessOfferEvidence, compareOfferEvidence } from '../../lib/ai/offer-evidence-consistency.mjs';
const offer = (amount = 12500, vatStatus = 'included') => ({
  ownerId: 'owner-A', projectId: 'project-A', contractorCvr: '12345678',
  priceEvidence: { sourceText: 'Samlet pris 12.500 kr inkl. moms', lineNumber: 3, amountDkk: amount, currency: 'DKK', vatStatus }
});
test('accepts explicitly cited DKK amount without asserting official verification', () => {
  assert.equal(assessOfferEvidence(offer()).status, 'evidence_present');
});
test('rejects fabricated or calculated amount absent from source', () => {
  assert.ok(assessOfferEvidence(offer(14000)).reasons.includes('amount_not_in_source'));
});
test('rejects missing line citation', () => {
  const o = offer(); o.priceEvidence.lineNumber = 0;
  assert.ok(assessOfferEvidence(o).reasons.includes('invalid_line_number'));
});
test('rejects zero, negative and fractional totals', () => {
  for (const amount of [0, -1, 12.5]) assert.ok(assessOfferEvidence(offer(amount)).reasons.includes('invalid_amount'));
});
test('blocks cross-owner and cross-project comparison', () => {
  assert.equal(compareOfferEvidence([offer(), offer()], 'owner-B', 'project-A').comparable, false);
  assert.equal(compareOfferEvidence([offer(), offer()], 'owner-A', 'project-B').comparable, false);
});
test('blocks comparison with unknown or mixed VAT basis', () => {
  assert.ok(compareOfferEvidence([offer(), offer(12500, 'unknown')], 'owner-A', 'project-A').reasons.includes('vat_not_comparable'));
  assert.ok(compareOfferEvidence([offer(), offer(12500, 'excluded')], 'owner-A', 'project-A').reasons.includes('vat_not_comparable'));
});
test('does not infer contractor trust from CVR format', () => {
  assert.equal(assessOfferEvidence(offer()).status, 'evidence_present');
});
