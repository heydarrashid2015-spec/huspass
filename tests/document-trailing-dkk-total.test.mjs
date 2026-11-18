import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const source=await readFile(new URL("../lib/document-intelligence.js",import.meta.url),"utf8");
const {parseDanishDocumentText}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));

test("Danish invoices accept a trailing DKK currency code on a labelled total",()=>{
 const r=parseDanishDocumentText("Nord El ApS\nFaktura\nFakturadato: 05.11.2026\nTotal: 1.250,00 DKK");
 assert.equal(r.amount,1250);
 assert.equal(r.requiresReview,true);
});

test("trailing DKK does not allow malformed grouping or conflicting totals",()=>{
 assert.equal(parseDanishDocumentText("Faktura\nTotal: 12 50,00 DKK").amount,null);
 assert.equal(parseDanishDocumentText("Faktura\nTotal: 1.250,00 DKK\nAt betale: 1.300,00 DKK").amount,null);
});

test("OCR-split total and trailing DKK still require user review",()=>{
 const r=parseDanishDocumentText("Faktura\nAt betale\n2.499,95 DKK");
 assert.equal(r.amount,2499.95);
 assert.equal(r.requiresReview,true);
});
