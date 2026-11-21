import test from "node:test";
import assert from "node:assert/strict";
import {needsPdfPageOcr, selectPdfPageText, safePdfRasterScale} from "../lib/document-ocr.js";

test("metadata-only invoice text layer requires OCR rather than silently losing totals",()=>{
 const layer="Faktura\nDato: 21.11.2026\nCVR: 12345678\nSide 1";
 assert.equal(needsPdfPageOcr(layer),true);
});

test("scanned PDF layer with only a bare payable heading requires OCR",()=>{
 assert.equal(needsPdfPageOcr("Faktura\nAt betale:\nScanned with scanner"),true);
});

test("scanner watermark OCR must not replace a complete payable amount in PDF text",()=>{
 const layer="Faktura\nAt betale: 1.234,50 DKK";
 assert.equal(selectPdfPageText(layer,"Scanned with scanner\nSide 1"),layer);
});

test("OCR subtotal must not replace an explicit payable amount from PDF text layer",()=>{
 const layer="Faktura\nAt betale: 1.234,50 DKK";
 assert.equal(selectPdfPageText(layer,"Faktura\nTotal: 900,00 DKK"),layer);
});

test("a different explicit OCR payable amount remains visible for user review",()=>{
 const layer="Faktura\nAt betale: 1.234,50 DKK";
 const recognized="Faktura\nAt betale: 1.299,50 DKK";
 assert.equal(selectPdfPageText(layer,recognized),recognized);
});

test("PDF raster scaling rejects dimensions that would exhaust canvas resources",()=>{
 assert.throws(()=>safePdfRasterScale(0,1200),/Ugyldige PDF-side dimensioner/);
 assert.throws(()=>safePdfRasterScale(100001,1200),/Ugyldige PDF-side dimensioner/);
 const scale=safePdfRasterScale(8000,8000);
 assert.ok(scale>0&&8000*8000*scale*scale<=3400000.01);
});
