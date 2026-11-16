import { bindContractorDocumentTotal } from './ai-verified-document-total.mjs';

// This gate must be called only after the server has authenticated the user,
// checked project membership in the database, and fetched the document from private storage.
// Client-provided metadata is never authorization evidence.
const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
function isPlainData(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return (proto === Object.prototype || proto === null) &&
    Object.values(Object.getOwnPropertyDescriptors(value)).every(d => has(d, 'value'));
}
const deny = reason => ({ accepted: false, reason, verifiedPrice: null });

export function verifyPrivateContractorTotal({
  quote, document, text, authenticatedOwnerId, authorizedProjectId, storageProof
} = {}) {
  if (!isPlainData(storageProof) || !isPlainData(document)) return deny('invalid_storage_proof');
  // Proof is an assertion from a trusted server-side storage adapter, not a client token.
  if (storageProof.access !== 'server_authenticated_private_read' ||
      storageProof.bucketVisibility !== 'private' ||
      storageProof.rlsAuthorized !== true ||
      storageProof.ownerId !== authenticatedOwnerId ||
      storageProof.projectId !== authorizedProjectId ||
      storageProof.documentId !== document.id ||
      document.storageBucket !== storageProof.bucket ||
      document.storagePath !== storageProof.path ||
      typeof storageProof.bucket !== 'string' || !storageProof.bucket.trim() ||
      typeof storageProof.path !== 'string' || !storageProof.path.trim() ||
      typeof document.storagePath !== 'string' || !document.storagePath.trim()) {
    return deny('private_document_not_verified');
  }
  if (typeof text !== 'string' || !text.trim()) return deny('missing_private_document_text');
  return bindContractorDocumentTotal({
    quote, document, text, authenticatedOwnerId, authorizedProjectId
  });
}
