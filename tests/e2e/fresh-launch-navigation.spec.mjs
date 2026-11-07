import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('fresh authenticated launch does not restore a persisted last view', () => {
  const source = readFileSync(new URL('../../app/page.js', import.meta.url), 'utf8');
  expect(source).not.toContain('restoreSavedView(');
  expect(source).not.toContain('localStorage.setItem(savedViewKey(');
  expect(source).toContain('restoreDocumentPicker(sessionUser.id)||"Overblik"');
  expect(source).toContain('restoreDocumentPicker(session.user.id)||"Overblik"');
});

test('auth refresh preserves current in-memory view and explicit deep links', () => {
  const source = readFileSync(new URL('../../app/page.js', import.meta.url), 'utf8');
  expect(source).toContain('prev!=="Auth"&&prev!=="CheckEmail"?prev:');
  expect(source).toContain('requestedFeature()||restoreDocumentPicker(sessionUser.id)||"Overblik"');
  expect(source).toContain('requestedFeature()||(prev!=="Auth"');
});
