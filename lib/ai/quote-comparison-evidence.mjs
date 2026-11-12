// Evidence-only comparison; no inferred costs, materials, warranties or tax status.
// The authenticated server must enforce owner/project/document RLS before calling this.
const nonempty = x => typeof x === 'string' && x.trim().length > 0;
const fields = ['scope', 'materials', 'warranty'];
export function compareContractorQuotes(quotes, { ownerId, projectId } = {}) {
  if (!nonempty(ownerId) || !nonempty(projectId) || !Array.isArray(quotes)) {
    return { comparable: false, reasons: ['invalid_context'], rows: [] };
  }
  const reasons = [];
  const rows = [];
  const seen = new Set();
  const seenDocuments = new Set();
  for (const quote of quotes) {
    if (!quote || quote.ownerId !== ownerId || quote.projectId !== projectId ||
        !nonempty(quote.id) || !nonempty(quote.documentId) || seen.has(quote.id)) {
      reasons.push('invalid_quote_boundary_or_duplicate');
      continue;
    }
    seen.add(quote.id);
    // A single source document cannot substantiate independent competing quotes.
    if (seenDocuments.has(quote.documentId)) {
      reasons.push('duplicate_source_document');
      continue;
    }
    seenDocuments.add(quote.documentId);
    const evidence = quote.evidence;
    // Evidence must be an already server-verified snapshot, never an AI-generated assertion.
    if (!evidence || evidence.verified !== true || evidence.documentId !== quote.documentId ||
        !nonempty(evidence.sourceHash) || !Number.isInteger(evidence.lineNumber) || evidence.lineNumber < 1) {
      reasons.push('missing_verified_price_evidence');
      continue;
    }
    if (quote.currency !== undefined && quote.currency !== 'DKK') {
      reasons.push('unsupported_quote_currency');
      continue;
    }
    const amount = quote.totalDkk;
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0 ||
        !Number.isSafeInteger(amount * 100)) {
      reasons.push('invalid_total');
      continue;
    }
    if (!['included', 'excluded'].includes(quote.vat)) reasons.push('unknown_vat_basis');
    const missing = fields.filter(field => !nonempty(quote[field]));
    if (missing.length) reasons.push('incomplete_scope_materials_or_warranty');
    rows.push(Object.freeze({
      id: quote.id, totalDkk: amount, vat: ['included', 'excluded'].includes(quote.vat) ? quote.vat : null,
      scope: nonempty(quote.scope) ? quote.scope.trim() : null,
      materials: nonempty(quote.materials) ? quote.materials.trim() : null,
      warranty: nonempty(quote.warranty) ? quote.warranty.trim() : null,
      source: Object.freeze({ documentId: quote.documentId, sourceHash: evidence.sourceHash, lineNumber: evidence.lineNumber }),
      missing
    }));
  }
  if (rows.length < 2) reasons.push('insufficient_verified_quotes');
  if (new Set(rows.map(row => row.vat)).size !== 1 || rows.some(row => !row.vat)) reasons.push('mixed_or_unknown_vat');
  // Different work scopes must never be ranked by price alone.
  if (new Set(rows.map(row => row.scope?.toLocaleLowerCase('da-DK'))).size !== 1) reasons.push('different_work_scope');
  const uniqueReasons = [...new Set(reasons)];
  return Object.freeze({ comparable: uniqueReasons.length === 0, reasons: uniqueReasons,
    rows: uniqueReasons.length === 0 ? rows.slice().sort((a,b) => a.totalDkk - b.totalDkk) : rows });
}
