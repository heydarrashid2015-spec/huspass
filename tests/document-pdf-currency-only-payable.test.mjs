import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const source=await readFile(new URL("../lib/document-ocr.js",import.meta.url),"utf8");
const {needsPdfPageOcr}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));

test("invoice with payable label and currency but no numeric value requires OCR",()=>{
 const text=["Faktura","Nord El ApS","Fakturadato: 05.11.2026","Total: 2.499,95","At betale: DKK","Side 1"].join("\n");
 assert.equal(needsPdfPageOcr(text),true);
});

test("invoice with payable label and complete same-line currency amount stays textual",()=>{
 const text=["Faktura","Nord El ApS","Fakturadato: 05.11.2026","Total: 2.499,95","At betale: DKK 2.499,95"].join("\n");
 assert.equal(needsPdfPageOcr(text),false);
});
