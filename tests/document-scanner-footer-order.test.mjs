import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const source=await readFile(new URL("../lib/document-ocr.js",import.meta.url),"utf8");
const {needsPdfPageOcr}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));

test("scanner footer after invoice heading triggers OCR, including multiline dates",()=>{
 assert.equal(needsPdfPageOcr("Faktura\nScanned with CamScanner"),true);
 assert.equal(needsPdfPageOcr("Invoice\nPage 1\nCreated with Adobe Scan"),true);
 assert.equal(needsPdfPageOcr("Kvittering\nDato: 12.11.2026\nScanned by Scanner"),true);
});
test("actual invoice fields before scanner footer preserve useful text",()=>{
 assert.equal(needsPdfPageOcr("Faktura\nCVR: 12345678\nTotal: 250,00\nScanned with CamScanner"),false);
});
