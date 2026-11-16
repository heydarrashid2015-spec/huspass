import test from 'node:test';
import assert from 'node:assert/strict';
import {needsPdfPageOcr, safePdfRasterScale, extractPdfPageText} from '../lib/document-ocr.js';

test('scanner metadata and bare invoice heading trigger OCR rather than silent text-layer acceptance', () => {
  assert.equal(needsPdfPageOcr('Scanned on 12.11.2026\nFaktura\nSide 1\nDato: 12.11.2026'), true);
  assert.equal(needsPdfPageOcr('Scanned with Scanner\nhttps://scanner.example\nPage 1'), true);
});
test('substantive invoice text layer is preserved without redundant OCR', () => {
  assert.equal(needsPdfPageOcr('Faktura nr. 12345\nCVR 12345678\nTotal inkl. moms: 1.250,00 kr\nBetalingsfrist: 20.11.2026'), false);
});
test('raster dimensions reject invalid inputs and cap allocation', () => {
  for (const [w,h] of [[0,100],[100,0],[Infinity,10],[NaN,10],[-1,10],[100001,10]]) {
    assert.throws(() => safePdfRasterScale(w,h), /dimensioner/);
  }
  for (const [w,h] of [[595,842],[100000,100000],[200,200]]) {
    const scale=safePdfRasterScale(w,h);
    assert.ok(scale>0 && scale<=1.5);
    assert.ok(w*scale<=8192+1e-6 && h*scale<=8192+1e-6);
    assert.ok(w*h*scale*scale<=3400000+1e-4);
  }
});
test('PDF glyph runs retain split monetary punctuation', () => {
  assert.match(extractPdfPageText([{str:'Total: 1.'},{str:'250,00',hasEOL:true}]), /1\.250,00/);
});
