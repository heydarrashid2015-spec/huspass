import test from "node:test";
import assert from "node:assert/strict";
import { needsPdfPageOcr } from "../lib/document-ocr.js";

// A selectable PDF layer can contain invoice metadata and a tax-column label
// while omitting all amounts. It must not suppress raster OCR.
test("metadata-only invoice with bare Moms heading requires OCR",()=>{
 const text="Faktura\nNord Byg ApS\nCVR 12345678\nDato: 12.11.2026\nFakturanr: 42\nMoms";
 assert.equal(needsPdfPageOcr(text),true);
});
test("invoice text with explicit VAT amount does not require OCR",()=>{
 const text="Faktura\nNord Byg ApS\nCVR 12345678\nDato: 12.11.2026\nFakturanr: 42\nMoms 250,00\nTotal 1250,00 DKK";
 assert.equal(needsPdfPageOcr(text),false);
});
