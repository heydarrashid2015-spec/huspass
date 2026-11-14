import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyPrivateContractorTotal as verify } from '../lib/ai-private-document-proof.mjs';

const quote = { ownerId: 'owner-A', projectId: 'project-A', contractorId: 'cvr-123',
  documentId: 'doc-A', sourceType: 'contractor_document', currency: 'DKK',
  totalPrice: 12500, vatIncluded: true };
const document = { id: 'doc-A', ownerId: 'owner-A', projectId: 'project-A',
  contractorId: 'cvr-123', sourceType: 'contractor_document',
  storageBucket: 'private-quotes', storagePath: 'owner-A/doc-A.pdf' };
const storageProof = { access: 'server_authenticated_private_read',
  bucketVisibility: 'private', rlsAuthorized: true, ownerId: 'owner-A',
  projectId: 'project-A', documentId: 'doc-A',
  bucket: 'private-quotes', path: 'owner-A/doc-A.pdf' };
const valid = { quote, document, storageProof, text: 'I alt: 12.500 kr inkl. moms',
  authenticatedOwnerId: 'owner-A', authorizedProjectId: 'project-A' };

test('passes documented total only with private server-side proof', () => {
  assert.equal(verify(valid).verifiedPrice, 12500);
});
test('rejects absent proof', () => {
  assert.equal(verify({ ...valid, storageProof: undefined }).reason, 'invalid_storage_proof');
});
test('rejects public bucket and unverified RLS', () => {
  assert.equal(verify({ ...valid, storageProof: { ...storageProof, bucketVisibility: 'public' } }).accepted, false);
  assert.equal(verify({ ...valid, storageProof: { ...storageProof, rlsAuthorized: false } }).accepted, false);
});
test('rejects cross-owner, cross-project and cross-document proof', () => {
  for (const key of ['ownerId', 'projectId', 'documentId']) {
    assert.equal(verify({ ...valid, storageProof: { ...storageProof, [key]: 'other' } }).accepted, false);
  }
});
test('rejects swapped private storage object or bucket', () => {
  assert.equal(verify({ ...valid, document: { ...document, storagePath: 'owner-B/doc.pdf' } }).accepted, false);
  assert.equal(verify({ ...valid, document: { ...document, storageBucket: 'public' } }).accepted, false);
});
test('rejects getter-backed proof without executing getter', () => {
  const proof = { ...storageProof };
  Object.defineProperty(proof, 'ownerId', { enumerable: true, get() { throw Error('getter executed'); } });
  assert.equal(verify({ ...valid, storageProof: proof }).reason, 'invalid_storage_proof');
});
test('rejects missing private text', () => {
  assert.equal(verify({ ...valid, text: '' }).reason, 'missing_private_document_text');
});
