// Pure, fail-closed evidence gate. Caller MUST fetch the document under authenticated RLS.
export function verifyQuoteDocumentBoundary({ sessionOwnerId, project, document, quote }) {
  const reasons = [];
  const validId = value => typeof value === 'string' && value.trim().length > 0;
  if (!validId(sessionOwnerId)) reasons.push('missing_authenticated_owner');
  if (!project || !validId(project.id) || project.ownerId !== sessionOwnerId) reasons.push('project_not_owned');
  if (!document || !validId(document.id) || document.ownerId !== sessionOwnerId || document.projectId !== project?.id) reasons.push('document_not_owned_by_project');
  if (!quote || quote.ownerId !== sessionOwnerId || quote.projectId !== project?.id || quote.documentId !== document?.id) reasons.push('quote_boundary_mismatch');
  if (!document || document.status !== 'ready' || !['text/plain', 'application/pdf'].includes(document.mimeType)) reasons.push('document_not_ready_or_supported');
  return Object.freeze({ allowed: reasons.length === 0, reasons });
}

// Verify an exact quote against the authenticated document's immutable text snapshot.
// Never trust line text submitted by a browser or an AI model as the source of truth.
export function verifyQuoteLineEvidence({ documentText, lineNumber, citedLine, amountDkk }) {
  const reasons = [];
  if (typeof documentText !== 'string' || !documentText.trim()) reasons.push('missing_trusted_document_text');
  const lines = typeof documentText === 'string' ? documentText.split(/\r?\n/) : [];
  if (!Number.isSafeInteger(lineNumber) || lineNumber < 1 || lineNumber > lines.length) reasons.push('invalid_line_number');
  const actual = lines[lineNumber - 1];
  if (typeof citedLine !== 'string' || citedLine !== actual) reasons.push('line_mismatch');
  if (!Number.isSafeInteger(amountDkk) || amountDkk <= 0) reasons.push('invalid_amount');
  if (typeof actual === 'string' && Number.isSafeInteger(amountDkk) && amountDkk > 0) {
    const matches = [...actual.matchAll(/(?:^|[^\d])((?:\d{1,3}(?:[. ]\d{3})+|\d+))(?:,00)?\s*(?:kr\.?|DKK)\b/gi)]
      .map(m => Number(m[1].replace(/[. ]/g, '')));
    if (!matches.includes(amountDkk)) reasons.push('amount_not_in_line');
    if (new Set(matches).size !== 1) reasons.push('ambiguous_amounts');
    if (!/\b(?:samlet|total|i alt|tilbudspris)\b/i.test(actual)) reasons.push('not_explicit_total');
  }
  return Object.freeze({ accepted: reasons.length === 0, reasons });
}
