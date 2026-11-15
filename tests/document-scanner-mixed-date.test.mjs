import test from "node:test";
import assert from "node:assert/strict";
import {parseDanishDocumentText} from "../lib/document-intelligence.js";

test("scanner timestamp beside invoice content is not a purchase date",()=>{
 const result=parseDanishDocumentText("Scanned with CamScanner\nScanned on: 14.11.2026\nFaktura\nTotal: 125,00");
 assert.equal(result.documentDate,null);
 assert.equal(result.amount,125);
 assert.equal(result.requiresReview,true);
});

test("explicit invoice date wins over scanner metadata date",()=>{
 const result=parseDanishDocumentText("Scanned with CamScanner\nScanned on: 14.11.2026\nFaktura\nFakturadato: 10.11.2026\nTotal: 125,00");
 assert.equal(result.documentDate,"2026-11-10");
});
