import test from "node:test";
import assert from "node:assert/strict";
import {needsPdfPageOcr} from "../lib/document-ocr.js";

test("scanner watermark with bare invoice heading is rasterized",()=>{
 assert.equal(needsPdfPageOcr("Scanned with CamScanner\nFaktura\nPage 1"),true);
});
test("scanner watermark and scan date alone do not suppress OCR",()=>{
 assert.equal(needsPdfPageOcr("Scanned with CamScanner\nFaktura\nDate: 12.11.2026"),true);
});
test("substantive invoice text layer is preserved",()=>{
 assert.equal(needsPdfPageOcr("Faktura nr 12345\nCVR 12345678\nTotal 1.250,00 DKK\nKunde adresse København"),false);
});
