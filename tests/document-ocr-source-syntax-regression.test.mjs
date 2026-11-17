import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";


const source=await readFile(new URL("../lib/document-ocr.js",import.meta.url),"utf8");
test("OCR module parses as JavaScript without invalid escaped line breaks",()=>{
  assert.doesNotThrow(()=>new Function(source.replace(/^export /gm,"")));
});
test("supplier metadata detection remains callable",async()=>{
  const {needsPdfPageOcr}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));
  assert.equal(needsPdfPageOcr("Faktura\nNord Byg ApS\nCVR: 12345678\nFakturanr: 2026-104"),true);
  assert.equal(needsPdfPageOcr("Faktura\nNord Byg ApS\nCVR: 12345678\nTotal: 1.250,00 kr"),false);
});
