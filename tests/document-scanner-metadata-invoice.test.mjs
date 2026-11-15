import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const source=await readFile(new URL("../lib/document-ocr.js",import.meta.url),"utf8");
const {needsPdfPageOcr}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));

test("scanner watermark, bare invoice heading and scanner date still require OCR",()=>{
 assert.equal(needsPdfPageOcr("Scanned with CamScanner\nFaktura\nScanned on: 15.11.2026\nPage 1"),true);
});
test("actual invoice data preserves searchable PDF text",()=>{
 assert.equal(needsPdfPageOcr("Scanned with CamScanner\nFaktura\nNord El ApS\nTotal: 1.250,00\nFakturadato: 05.11.2026"),false);
});
