import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const source=await readFile(new URL("../lib/document-ocr.js",import.meta.url),"utf8");
const {needsPdfPageOcr}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));

test("scanner text layer with supplier and date but no financial data needs OCR",()=>{
 assert.equal(needsPdfPageOcr("Faktura\nNord Byg ApS\nDato: 12.11.2026\nScanned with CamScanner"),true);
});
test("scanner footer must not force OCR when actual total exists",()=>{
 assert.equal(needsPdfPageOcr("Faktura\nNord Byg ApS\nDato: 12.11.2026\nTotal: 1.250,00 kr\nScanned with CamScanner"),false);
});
test("ordinary text-only invoice without scanner marker remains text",()=>{
 assert.equal(needsPdfPageOcr("Faktura\nNord Byg ApS\nDato: 12.11.2026"),false);
});
