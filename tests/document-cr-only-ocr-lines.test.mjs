import test from "node:test";
import assert from "node:assert/strict";
import {parseDanishDocumentText} from "../lib/document-intelligence.js";

test("CR-only OCR lines preserve invoice field boundaries and require review",()=>{
 const result=parseDanishDocumentText("Nord El ApS\rFaktura\rFakturadato: 05.11.2026\rTotal: 1.234,56 DKK\rCVR: 12345678");
 assert.equal(result.documentDate,"2026-11-05");
 assert.equal(result.amount,1234.56);
 assert.equal(result.cvr,"12345678");
 assert.equal(result.requiresReview,true);
});

test("CR-only conflicting totals cannot be silently accepted",()=>{
 const result=parseDanishDocumentText("Faktura\rTotal: 1.234,56 DKK\rAt betale: 1.999,00 DKK");
 assert.equal(result.amount,null);
 assert.equal(result.requiresReview,true);
});
