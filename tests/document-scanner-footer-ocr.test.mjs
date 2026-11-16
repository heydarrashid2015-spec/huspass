import test from 'node:test';
import assert from 'node:assert/strict';
import {needsPdfPageOcr} from '../lib/document-ocr.js';

test('scanner footer with only heading and page number must trigger OCR', () => {
 assert.equal(needsPdfPageOcr('Faktura\nSide 1\nScanned with Mobile Scanner'), true);
 assert.equal(needsPdfPageOcr('Invoice\nPage 2\nScanned on 12.11.2026'), true);
});

test('substantive invoice content with scanner footer must not be discarded', () => {
 assert.equal(needsPdfPageOcr('Faktura nr. 123\nCVR 12345678\nTotal inkl. moms: 1.250,00 kr\nScanned with Mobile Scanner'), false);
});
