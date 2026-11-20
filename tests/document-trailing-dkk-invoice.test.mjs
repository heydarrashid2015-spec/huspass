import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const source=await readFile(new URL("../lib/document-intelligence.js",import.meta.url),"utf8");
const {parseDanishDocumentText}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));

test("recognizes trailing DKK on a Danish invoice total",()=>{
 const result=parseDanishDocumentText("Faktura\\nAt betale: 1.234,56 DKK".replaceAll("\\n","\n"));
 assert.equal(result.amount,1234.56);
 assert.equal(result.requiresReview,true);
});

test("recognizes trailing DKK when OCR splits the label and amount",()=>{
 const result=parseDanishDocumentText("Faktura\nAt betale:\n1.234,56 DKK");
 assert.equal(result.amount,1234.56);
 assert.equal(result.requiresReview,true);
});

test("does not silently accept a malformed second total alongside DKK",()=>{
 const result=parseDanishDocumentText("Faktura\nAt betale: 1.234,56 DKK\nTotal: ukendt");
 assert.equal(result.amount,null);
});
