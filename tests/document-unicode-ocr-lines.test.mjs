import test from "node:test";
import assert from "node:assert/strict";
import {parseDanishDocumentText} from "../lib/document-intelligence.js";

test("Unicode OCR line separators preserve Danish invoice fields and review",()=>{
 const result=parseDanishDocumentText("Nord El ApS\u2028Faktura\u2028Fakturadato: 05.11.2026\u2029Total: 1.234,56 DKK\u2028CVR: 12345678");
 assert.equal(result.documentDate,"2026-11-05");
 assert.equal(result.amount,1234.56);
 assert.equal(result.cvr,"12345678");
 assert.equal(result.requiresReview,true);
});

test("Unicode OCR line separators do not hide conflicting invoice totals",()=>{
 const result=parseDanishDocumentText("Faktura\u2028Total: 1.234,56 DKK\u2029At betale: 1.999,00 DKK");
 assert.equal(result.amount,null);
 assert.equal(result.requiresReview,true);
});
