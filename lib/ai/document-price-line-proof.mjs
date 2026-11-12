// Strict source-document line binding. Call only after server-side document ownership checks.
// This does not authenticate the document or authorize access to it.
export function verifyDocumentPriceLine(documentText, evidence) {
  const reasons = [];
  if (typeof documentText !== 'string' || !documentText.trim()) return { verified: false, reasons: ['missing_document'] };
  if (!evidence || typeof evidence !== 'object') return { verified: false, reasons: ['missing_evidence'] };
  const lines = documentText.replace(/\r\n?/g, '\n').split('\n');
  if (!Number.isSafeInteger(evidence.lineNumber) || evidence.lineNumber < 1 || evidence.lineNumber > lines.length) {
    return { verified: false, reasons: ['line_out_of_range'] };
  }
  const sourceLine = lines[evidence.lineNumber - 1];
  if (typeof evidence.sourceText !== 'string' || evidence.sourceText !== sourceLine) reasons.push('source_line_mismatch');
  if (!Number.isSafeInteger(evidence.amountDkk) || evidence.amountDkk <= 0 || evidence.currency !== 'DKK') reasons.push('invalid_amount_or_currency');
  // Require an explicitly labelled total, not an arbitrary materials or hourly-rate figure.
  const totalMatch = sourceLine.match(/(?:samlet\s+pris|total(?:pris)?|i\s+alt)\s*:?\s*(\d{1,3}(?:[. ]\d{3})+|\d+)(?:,00)?\s*(?:kr\.?|dkk)\b/i);
  if (!totalMatch) reasons.push('no_explicit_total');
  else if (Number(totalMatch[1].replace(/[. ]/g, '')) !== evidence.amountDkk) reasons.push('total_amount_mismatch');
  // If more than one total label occurs, require human review instead of guessing.
  const labels = sourceLine.match(/(?:samlet\s+pris|total(?:pris)?|i\s+alt)\s*:/gi) || [];
  if (labels.length > 1) reasons.push('ambiguous_totals');
  return { verified: reasons.length === 0, reasons };
}
