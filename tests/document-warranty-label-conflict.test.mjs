import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDanishDocumentText } from '../lib/document-intelligence.js';

test('unreadable competing warranty expiry must not be silently ignored', () => {
  const result = parseDanishDocumentText('Faktura\nGaranti udløber: 12.05.2028\nGaranti til:');
  assert.equal(result.warrantyEnd, null);
  assert.equal(result.requiresReview, true);
});

test('two matching explicit warranty expiry fields remain a suggestion for review', () => {
  const result = parseDanishDocumentText('Garanti udløber: 12.05.2028\nGaranti til: 12.05.2028');
  assert.equal(result.warrantyEnd, '2028-05-12');
  assert.equal(result.requiresReview, true);
});
