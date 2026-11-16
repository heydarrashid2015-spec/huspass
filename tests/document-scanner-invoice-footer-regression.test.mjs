import test from "node:test";
import assert from "node:assert/strict";
import { needsPdfPageOcr } from "../lib/document-ocr.js";

test("scanner footer and invoice number without financial content require OCR",()=>{
 assert.equal(needsPdfPageOcr("Faktura\nFakturanr: 123-ABC\nDato: 12.11.2026\nScanned with CamScanner"),true);
 assert.equal(needsPdfPageOcr("Scanned with CamScanner\nFaktura\nFakturanr: 123-ABC"),true);
});
test("invoice with a substantive total is not needlessly rasterized",()=>{
 assert.equal(needsPdfPageOcr("Faktura\nFakturanr: 123-ABC\nTotal: 1.250,00 kr\nScanned with CamScanner"),false);
});
