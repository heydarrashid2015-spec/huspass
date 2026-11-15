// Evidence-preserving comparison of contractor quotes. Pure function; no outreach or storage.
// Never infer VAT, scope, materials or warranty from a numeric price alone.
const FIELDS = ['priceOre','vatIncluded','materials','warranty','scope'];
const has = (o,k) => Object.prototype.hasOwnProperty.call(o,k);
export function compareContractorQuotes(quotes) {
  if (!Array.isArray(quotes)) return [];
  const ids = new Set();
  return quotes.map(q => {
    if (!q || typeof q !== 'object' || typeof q.id !== 'string' || !q.id.trim() || ids.has(q.id))
      return null;
    ids.add(q.id);
    const evidence = q.evidence && typeof q.evidence === 'object' ? q.evidence : {};
    const fields = {};
    for (const field of FIELDS) {
      const source = evidence[field];
      const validSource = source && typeof source === 'object' &&
        typeof source.excerpt === 'string' && source.excerpt.trim().length > 0 &&
        typeof source.documentId === 'string' && source.documentId.trim().length > 0;
      let validValue = false;
      if (field === 'priceOre') validValue = typeof q[field] === 'string' && /^\\d+$/.test(q[field]) && BigInt(q[field]) > 0n;
      else if (field === 'vatIncluded') validValue = typeof q[field] === 'boolean';
      else validValue = typeof q[field] === 'string' && q[field].trim().length > 0;
      fields[field] = validSource && validValue && has(q,field)
        ? Object.freeze({status:'documented',value:q[field],documentId:source.documentId,excerpt:source.excerpt})
        : Object.freeze({status:'unknown',value:null});
    }
    return Object.freeze({id:q.id,fields:Object.freeze(fields),
      comparableTotal: fields.priceOre.status === 'documented' &&
        fields.vatIncluded.status === 'documented' && fields.vatIncluded.value === true});
  }).filter(Boolean);
}
