import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const source=await readFile(new URL("../lib/document-ocr.js",import.meta.url),"utf8");
const {needsPdfPageOcr}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));

test("metadata-only supplier and invoice number without date requires OCR",()=>{
 assert.equal(needsPdfPageOcr("Faktura\nNord Byg ApS\nCVR: 12345678\nFakturanr: 2026-104"),true);
});
test("supplier metadata with real financial totals stays text searchable",()=>{
 assert.equal(needsPdfPageOcr("Faktura\nNord Byg ApS\nCVR: 12345678\nFakturanr: 2026-104\nTotal: 1.250,00 kr"),false);
});
