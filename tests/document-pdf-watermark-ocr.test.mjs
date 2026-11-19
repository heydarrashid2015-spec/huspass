import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const source=await readFile(new URL("../lib/document-ocr.js",import.meta.url),"utf8");
const {needsPdfPageOcr}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));

test("scanner watermark does not suppress OCR on scanned invoice pages",()=>{
 assert.equal(needsPdfPageOcr("Scanned with CamScanner"),true);
 assert.equal(needsPdfPageOcr("Created with Adobe Scan"),true);
 assert.equal(needsPdfPageOcr(""),true);
});
test("complete invoice total does not require unnecessary raster OCR",()=>{
 assert.equal(needsPdfPageOcr("Faktura\nCVR: 12345678\nTotal: 250,00"),false);
});
test("incomplete invoice metadata requires OCR to recover payable amount",()=>{
 assert.equal(needsPdfPageOcr("Faktura\nCVR: 12345678\nTotal:"),true);
 assert.equal(needsPdfPageOcr("Kvittering\nDato: 12.11.2026"),true);
});
test("non-document short PDF text layer triggers OCR fallback",()=>{
 assert.equal(needsPdfPageOcr("Page 1 - copied text layer"),true);
});

test("scanner watermark and scanner URL on separate lines still trigger OCR",()=>{
 assert.equal(needsPdfPageOcr("Scanned with CamScanner\nhttps://www.camscanner.com"),true);
 assert.equal(needsPdfPageOcr("Created with Adobe Scan\nhttps://scan.example"),true);
});

test("scanner metadata with a date or page counter still requires OCR",()=>{
 assert.equal(needsPdfPageOcr("Scanned with CamScanner\nDato: 12.11.2026"),true);
 assert.equal(needsPdfPageOcr("Created with Adobe Scan\nPage 1\nhttps://scan.example"),true);
});

// PDF.js can emit empty lines between scanner metadata entries.
test("blank lines between scanner metadata must not suppress OCR",()=>{
 assert.equal(needsPdfPageOcr("Scanned with CamScanner\n\nDato: 12.11.2026\n\nPage 1"),true);
 assert.equal(needsPdfPageOcr("Created with Adobe Scan\r\n\r\nhttps://scan.example\r\nPage 2"),true);
});

// Scanner text layers can include the invoice heading without any invoice fields.
test("scanner watermark plus a bare invoice heading still requires OCR",()=>{
 assert.equal(needsPdfPageOcr("Scanned with CamScanner\nFaktura"),true);
 assert.equal(needsPdfPageOcr("Created with Adobe Scan\nInvoice\nPage 1"),true);
 assert.equal(needsPdfPageOcr("Scanned with CamScanner\nFaktura\nCVR: 12345678\nTotal: 250,00"),false);
});
