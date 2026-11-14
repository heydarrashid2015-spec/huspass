import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const source=await readFile(new URL("../lib/document-intelligence.js",import.meta.url),"utf8");
const {parseDanishDocumentText}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));

test("extracts a CVR number split into adjacent OCR lines",()=>{
 const result=parseDanishDocumentText("Nord El ApS\nFaktura\nCVR\n12 34 56 78\nI alt: 500,00");
 assert.equal(result.cvr,"12345678");
 assert.equal(result.requiresReview,true);
});
test("does not borrow a CVR value across unrelated OCR lines",()=>{
 const result=parseDanishDocumentText("Faktura\nCVR\nFakturadato: 05.11.2026\n12 34 56 78");
 assert.equal(result.cvr,null);
});
test("does not silently choose conflicting split and inline CVR values",()=>{
 const result=parseDanishDocumentText("Faktura\nCVR\n12345678\nCVR: 87654321");
 assert.equal(result.cvr,null);
});
test("does not accept an incomplete split CVR number",()=>{
 const result=parseDanishDocumentText("Faktura\nCVR\n1234567");
 assert.equal(result.cvr,null);
});
