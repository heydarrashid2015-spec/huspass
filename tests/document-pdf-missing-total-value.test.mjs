import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const source=await readFile(new URL("../lib/document-ocr.js",import.meta.url),"utf8");
const {needsPdfPageOcr}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));
test("OCR incomplete invoice text layer with a bare total label but no value",()=>{
 assert.equal(needsPdfPageOcr("Faktura\nNord El ApS\nFakturadato: 05.11.2026\nTotal:\nSide 1"),true);
});
test("preserve complete invoice total and avoid unnecessary OCR",()=>{
 assert.equal(needsPdfPageOcr("Faktura\nNord El ApS\nFakturadato: 05.11.2026\nTotal: 1.250,00 DKK"),false);
});
