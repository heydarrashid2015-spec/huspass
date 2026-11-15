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
test("short but substantive invoice text retains its text layer",()=>{
 assert.equal(needsPdfPageOcr("Faktura\\nCVR: 12345678\\nTotal: 250,00"),false);
 assert.equal(needsPdfPageOcr("Kvittering\\nDato: 12.11.2026"),false);
});
test("non-document short PDF text layer triggers OCR fallback",()=>{
 assert.equal(needsPdfPageOcr("Page 1 - copied text layer"),true);
});
