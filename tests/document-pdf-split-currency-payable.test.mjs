import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const source=await readFile(new URL("../lib/document-ocr.js",import.meta.url),"utf8");
const {needsPdfPageOcr}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));

test("PDF with currency on its own line and payable amount on next line retains usable text",()=>{
 const text=["Faktura","Nord El ApS","Fakturadato: 05.11.2026","Total: 2.499,95","At betale:","DKK","2.499,95"].join("\n");
 assert.equal(needsPdfPageOcr(text),false);
});

test("PDF with currency on its own line but no payable amount needs OCR",()=>{
 const text=["Faktura","Nord El ApS","Fakturadato: 05.11.2026","Total: 2.499,95","At betale:","DKK","Side 1"].join("\n");
 assert.equal(needsPdfPageOcr(text),true);
});
