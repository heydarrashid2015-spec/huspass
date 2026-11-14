import test from 'node:test';
import assert from 'node:assert/strict';
import { bindContractorDocumentTotal as bind } from '../lib/ai-verified-document-total.mjs';

const quote = { ownerId: 'owner-A', projectId: 'project-A', contractorId: 'cvr-123',
  documentId: 'doc-A', sourceType: 'contractor_document', currency: 'DKK',
  totalPrice: 12500, vatIncluded: true };
const document = { id: 'doc-A', ownerId: 'owner-A', projectId: 'project-A',
  contractorId: 'cvr-123', sourceType: 'contractor_document' };
const input = { quote, document, text: 'I alt: 12.500 kr inkl. moms',
  authenticatedOwnerId: 'owner-A', authorizedProjectId: 'project-A' };
test('accepts explicitly documented total in authorized scope', () => {
  assert.deepEqual(bind(input), { accepted: true, reason: null, verifiedPrice: 12500,
    currency: 'DKK', vatIncluded: true, evidence: 'I alt: 12.500 kr inkl. moms', documentId: 'doc-A' });
});
test('rejects cross-account document even if quote belongs to caller', () => {
  assert.equal(bind({ ...input, document: { ...document, ownerId: 'owner-B' } }).reason, 'document_scope_mismatch');
});
test('rejects cross-project document and contractor mismatch', () => {
  assert.equal(bind({ ...input, document: { ...document, projectId: 'project-B' } }).accepted, false);
  assert.equal(bind({ ...input, document: { ...document, contractorId: 'other' } }).accepted, false);
});
test('rejects price not matching the original contractor text', () => {
  assert.equal(bind({ ...input, quote: { ...quote, totalPrice: 12000 } }).reason, 'price_mismatch');
});
test('rejects missing VAT basis and VAT disagreement', () => {
  assert.equal(bind({ ...input, text: 'I alt: 12.500 kr' }).reason, 'vat_unspecified');
  assert.equal(bind({ ...input, quote: { ...quote, vatIncluded: false } }).reason, 'vat_mismatch');
});
test('rejects ambiguous contractor totals', () => {
  assert.equal(bind({ ...input, text: 'Total: 12.500 kr inkl. moms\nI alt: 10.000 kr ekskl. moms' }).accepted, false);
});
test('rejects missing authenticated server scope', () => {
  assert.equal(bind({ ...input, authenticatedOwnerId: null }).reason, 'missing_server_scope');
});
test('rejects arrays, class instances and getter-backed records without reading getter', () => {
  assert.equal(bind({ ...input, quote: [] }).reason, 'invalid_record');
  assert.equal(bind({ ...input, document: new Date() }).reason, 'invalid_record');
  const malicious = { ...document };
  Object.defineProperty(malicious, 'ownerId', { enumerable: true, get() { throw Error('executed'); } });
  assert.equal(bind({ ...input, document: malicious }).reason, 'invalid_record');
});
