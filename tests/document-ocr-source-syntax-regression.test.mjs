import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {spawnSync} from "node:child_process";

const source=await readFile(new URL("../lib/document-ocr.js",import.meta.url),"utf8");
test("OCR ES module parses without invalid escaped line breaks",()=>{
  const result=spawnSync(process.execPath,["--input-type=module","--check"],{input:source,encoding:"utf8"});
  assert.equal(result.status,0,result.stderr);
});
test("supplier metadata detection remains callable",async()=>{
  const {needsPdfPageOcr}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));
  assert.equal(needsPdfPageOcr("Faktura\nNord Byg ApS\nCVR: 12345678\nFakturanr: 2026-104"),true);
  assert.equal(needsPdfPageOcr("Faktura\nNord Byg ApS\nCVR: 12345678\nTotal: 1.250,00 kr"),false);
});
