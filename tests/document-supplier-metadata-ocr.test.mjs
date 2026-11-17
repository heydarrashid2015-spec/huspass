import test from 'node:test';
import assert from 'node:assert/strict';
import {needsPdfPageOcr} from '../lib/document-ocr.js';

test('invoice metadata with supplier but no monetary data must be OCR scanned', () => {
 assert.equal(needsPdfPageOcr('Faktura\nNordlys VVS ApS\nCVR: 12345678\nDato: 12.11.2026\nFakturanr: 2026-17'), true);
 assert.equal(needsPdfPageOcr('Faktura\nNordlys VVS ApS\nCVR: 12345678\nDato: 12.11.2026\nTotal inkl. moms: 1.250,00 kr'), false);
});
