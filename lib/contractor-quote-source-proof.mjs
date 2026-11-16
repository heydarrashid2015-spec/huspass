// Verify contractor quote evidence against trusted, already-authorized document text.
// The caller must enforce authentication, ownership and RLS before supplying documents.
// This module performs no network requests and never treats user-supplied excerpts as proof.
const ownData = (obj, key) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(obj, key);
  return descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value')
    ? descriptor.value : undefined;
};
export function verifyQuoteEvidenceAgainstDocuments(quote, documents) {
  if (!quote || typeof quote !== 'object' || Array.isArray(quote) ||
      !Array.isArray(documents)) return Object.freeze({verified:false,fields:Object.freeze({})});
  const evidence = ownData(quote, 'evidence');
  const fields = {};
  for (const field of ['priceOre','vatIncluded','materials','warranty','scope']) {
    const source = ownData(evidence, field);
    const documentId = ownData(source, 'documentId');
    const excerpt = ownData(source, 'excerpt');
    // Fail closed on duplicate document IDs: ambiguous provenance is not proof.
    const matches = typeof documentId === 'string' && documentId.trim()
      ? documents.filter(doc => ownData(doc,'id') === documentId) : [];
    const text = matches.length === 1 ? ownData(matches[0], 'text') : undefined;
    fields[field] = typeof excerpt === 'string' && excerpt.trim().length > 0 &&
      typeof text === 'string' && text.includes(excerpt);
  }
  return Object.freeze({verified:Object.values(fields).every(Boolean),fields:Object.freeze(fields)});
}
