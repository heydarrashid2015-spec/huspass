import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyQuoteDocumentBoundary, verifyQuoteLineEvidence } from '../../lib/ai/quote-document-boundary.mjs';

const owner = 'owner-a';
const project = { id: 'project-a', ownerId: owner };
const document = { id: 'doc-a', projectId: project.id, ownerId: owner, status: 'ready', mimeType: 'application/pdf' };
const quote = { documentId: document.id, projectId: project.id, ownerId: owner };
const boundary = overrides => verifyQuoteDocumentBoundary({ sessionOwnerId: owner, project, document, quote, ...overrides });

test('accepts consistent tenant/project/document identifiers only as a secondary gate', () => {
  assert.equal(boundary({}).allowed, true);
});
test('denies missing authentication', () => {
  assert.ok(boundary({ sessionOwnerId: '' }).reasons.includes('missing_authenticated_owner'));
});
test('denies cross-tenant document', () => {
  assert.ok(boundary({ document: { ...document, ownerId: 'owner-b' } }).reasons.includes('document_not_owned_by_project'));
});
test('denies cross-project document', () => {
  assert.ok(boundary({ document: { ...document, projectId: 'project-b' } }).reasons.includes('document_not_owned_by_project'));
});
test('denies forged quote document ID', () => {
  assert.ok(boundary({ quote: { ...quote, documentId: 'other' } }).reasons.includes('quote_boundary_mismatch'));
});
test('denies unready or unsupported documents', () => {
  assert.equal(boundary({ document: { ...document, status: 'pending' } }).allowed, false);
  assert.equal(boundary({ document: { ...document, mimeType: 'image/jpeg' } }).allowed, false);
});
const source = 'Arbejde\nSamlet pris 12.500 kr inkl. moms';
const evidence = overrides => verifyQuoteLineEvidence({ documentText: source, lineNumber: 2, citedLine: 'Samlet pris 12.500 kr inkl. moms', amountDkk: 12500, ...overrides });
test('accepts exact sourced total', () => assert.equal(evidence({}).accepted, true));
test('rejects modified line or wrong amount', () => {
  assert.ok(evidence({ citedLine: 'Samlet pris 15.000 kr' }).reasons.includes('line_mismatch'));
  assert.ok(evidence({ amountDkk: 15000 }).reasons.includes('amount_not_in_line'));
});
test('rejects wrong line index and non-total', () => {
  assert.ok(evidence({ lineNumber: 1 }).reasons.includes('line_mismatch'));
  assert.ok(evidence({ documentText: 'Materialer 12.500 kr', lineNumber: 1, citedLine: 'Materialer 12.500 kr' }).reasons.includes('not_explicit_total'));
});
test('rejects ambiguous totals', () => {
  const line = 'Samlet 12.500 kr eller 15.000 kr';
  assert.ok(evidence({ documentText: line, lineNumber: 1, citedLine: line }).reasons.includes('ambiguous_amounts'));
});
